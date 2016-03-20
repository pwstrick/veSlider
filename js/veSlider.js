;(function (factory) {
	/* CommonJS module. */
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = factory(window);
    /* AMD module. */
    } else if (typeof define === "function" && define.amd) {
        define(factory(window));
    /* Browser globals. */
    } else {
        factory(window);
    }
}(function(global, undefined) {
	"use strict";
	
	var veSliderProtytype = veSlider.prototype;
	var slice = [].slice;//强制转换成数组
	//默认参数
	var defaults = {
		container: '',	//容器对象
		auto: false,	//自动轮播
		easing: 'ease-in',	//缓动类型
		duration: 3000 //自动轮播间隔时间
	};
	
	//常量
	var CONST = {
		LEFT:'left',
		RIGHT:'right'
	}
	
	//绑定的事件 目前只适用于webkit内核浏览器
	var events = {start:'touchstart', move:'touchmove', end:'touchend', transition:'webkitTransitionEnd'};
	
	/**
	 * 简单的数组合并
	 */
	function extend(source, target) {
		for(var key in source) {
			if(source.hasOwnProperty(key))
				target[key] = source[key];
		}
		return target;
	}
	
	/**
	 * 获取到祖先中最近的标签
	 */
	function closest(dom, tagName) {
		do {
			if(dom.tagName == tagName)
				return dom;
		}while(dom = dom.parentNode);
		return false;
	}
	
	/**
	 * 设置translateX属性 用于滑动
	 */
	function setTranslateX(dom, i, size, offsetX) {
		dom.style.webkitTransform = 'translateX('+(offsetX + size.width * i)+'px)';
	}
	
	/**
	 * 设置transition属性
	 */
	function setTransition(dom, easing, time) {
		if(time === undefined) {
			return;
		}
		dom.style.webkitTransition = '-webkit-transform '+time+'s '+easing;
	}
	
	function veSlider(opts) {
		if(!opts.container) {
			throw new Error('请传入正确的容器');
		}
		
		this.opts = extend(opts, defaults); //默认参数与传入参数合并
		this.container = this.opts.container;
		this.size = this.container.getBoundingClientRect();//容器尺寸
		this.children = slice.call(this.container.children);//容器的子集
		this.last = this.children.length - 1; //子集最后一位
		this.currentIndex = 0;//当前索引
		this._bind(); //绑定动画事件
		
		this.caculate(this.currentIndex); //初始化子集的偏移量
		this.offset = {X:0, Y:0};	//X轴与Y轴的移动值
		this.opts.auto && this.play();	//初始化自动轮播
	};
	
	/**
	 * 计算滑动值
	 * @param {int} index 当前索引值
	 * @param {string} time 过渡完成时间
	 * @param {int} offsetX
	 */
	veSliderProtytype.caculate = function(index, time, offsetX) {
		var _this = this, last = this.last;
		this.children.forEach(function(dom, i) {
			var x = i - index;
			if(index == 0 && i == last) {
				x = -1;
			}else if(index == last && i == 0) {
				x = 1;
			}
			setTransition(dom, _this.opts.easing, time);
			setTranslateX(dom, x, _this.size, offsetX||0);
		});
	};
	
	/**
	 * 滑动到指定处
	 * @param {int} index
	 * @param {string} time 过渡完成时间
	 */
	veSliderProtytype.slideTo = function(index, time) {
		this.currentIndex = index = this._setThreshold(index);
		var other = this.direction == CONST.LEFT ? (index-1) : (index+1);
		other = this._setThreshold(other);

		//隐藏需要移动的子集
		this.children.forEach(function(dom, i) {
			if(i == index || i == other) {
				return;
			}
			dom.style.visibility = 'hidden';
		});
		//手指移动的时候用.1 自动移动的时候用.4
		this.caculate(index, time || '.1');
	};
	
	/**
	 * 设置索引阈值
	 */
	veSliderProtytype._setThreshold = function(index) {
		if(index < 0)
			return this.last;
		if(index > this.last)
			return 0;
		return index;
	};
	
	/**
	 * 绑定开始事件
	 */
	veSliderProtytype.startEvt = function(e) {
		//UC浏览器中在边界滑动会将整个屏幕滑过去 但会阻止滚动
		e.preventDefault();
		this.startTime = new Date().getTime();//开始时间戳
		this.startX = e.touches[0].clientX;//起始坐标
		this.startY = e.touches[0].clientY;//起始坐标
		global.clearTimeout(this.autoName);//取消自动轮播
	};
	
	/**
	 * 绑定手指移动事件
	 */
	veSliderProtytype.moveEvt = function(e) {
		//计算位移
		this.offset = {
			X: e.touches[0].clientX - this.startX,
			Y: e.touches[0].clientY - this.startY
		};
		
		//判断是否在移动
		if(Math.abs(this.offset.X) - Math.abs(this.offset.Y) > 10) {
			e.preventDefault();//Android浏览器中会卡顿
			this.caculate(this.currentIndex, '0', this.offset.X);
		}
	};
	
	/**
	 * 绑定结束事件
	 */
	veSliderProtytype.endEvt = function(e) {
		//超过了容器的一半才能滑动过去
		var boundary = this.size.width / 2;
		var endTime = new Date().getTime();
		var offset = this.offset;

		//300ms间隔算一次快速滑动需要14px
		boundary = endTime - this.startTime > 300 ? boundary : 14;
		        
		var needLink = function(dom) {
			dom = closest(dom, 'A');
			if(dom) {
				global.location.href = dom.href
                return true;
			}
		    return false;
		};
		        
		//做点击操作
		if(Math.abs(offset.X) < 10 && Math.abs(offset.Y) < 10) {
		    needLink(e.target);
		}
		if(offset.X > boundary) {//向右滑动
			this.direction = CONST.RIGHT;
			this.currentIndex--;
		}else if(offset.X < -boundary) {//向左滑动
			this.direction = CONST.LEFT;
			this.currentIndex++;
		}else {
			//返回原位 方向要相反
			this.direction = offset.X < 0 ? CONST.RIGHT : CONST.LEFT;
		}
		this.slideTo(this.currentIndex);
		//重置偏移对象
		this.offset = {X:0, Y:0};
		this.opts.auto && this.play();//重新启动自动轮播
	};
	
	/**
	 * 过渡结束后触发
	 */
	veSliderProtytype.transitionEvt = function(e) {
		e.target.style.visibility = 'visible';
	};
	
	/**
	 * 移动到下一个 子集
	 */
	veSliderProtytype.slideNext = function() {
		this.direction = CONST.LEFT;
		this.slideTo(++this.currentIndex, '.4');
	};
	
	/**
	 * 自动播放
	 */
	veSliderProtytype.play = function() {
		var _this = this;
		_this.autoName = global.setTimeout(function() {
			_this.slideNext();
			_this.play();
		}, _this.opts.duration);
	};
	/**
	 * 绑定事件
	 */
	veSliderProtytype._bind = function() {
		this.container.addEventListener(events.start, this);
        this.container.addEventListener(events.move, this);
        this.container.addEventListener(events.end, this);
        this.container.addEventListener(events.transition, this.transitionEvt, false);
	};
	
	/**
	 * 高级的绑定方法
	 */
	veSliderProtytype.handleEvent = function(e) {
		switch (e.type) {
			case events.start:
				this.startEvt(e);
				break;
			case events.move:
				this.moveEvt(e);
				break;
			case events.end:
				this.endEvt(e);
				break;
		};
	};
	
	global.veSlider = veSlider;
	return veSlider;
}));