/**
 * Author zhouzy
 * Date   2014/9/18
 * SelectBox 组件
 *
 */
!function(window){

    "use strict";

    var cri = window.cri,
        $   = window.jQuery;

    var SELECTBOX_GROUP = "selectBox-group",
        SELECTBOX_BTN   = "fa fa-caret-down",
        OPTIONS  = "options",
        SELECTED = "selected";

    var _defaultOptions = {
        label:'',
        data:null,  //Array [{value:"",text:""},{value:"",text:""}]
        change:null //Function: call back after select option
    };

    var SelectBox = cri.Widgets.extend(function(element,options){
        this.options = _defaultOptions;
        this.$selectBoxGroup = null;
        this.input = null;
        this._value = null;
        this._text = null;
        cri.Widgets.apply(this,arguments);
    });

    $.extend(SelectBox.prototype,{
        _eventListen:function(){
        },

        _init:function(){
            this._create();
        },

        _create:function(){
            this.$element.hide();
            this.$element.wrap('<span class="' + SELECTBOX_GROUP + '"></span>');
            this.$selectBoxGroup = this.$element.parent();
            this._value = this.$element.val();
            this._text  = this.$element.find("option:selected").text();
            this._createInput();
            this._createListView();
        },

        _createInput:function(){
            var that = this,
                button = {iconCls:SELECTBOX_BTN,handler:function(){
                    that.listView.toggle();
                }};
            this.input = new cri.Input(this.$element,{
                label:that.label,
                readonly:true,
                value:that._text,
                button:button,
                onFocus:function(){
                    that.listView.toggle();
                }
            });
        },

        _createListView:function(){
            var that = this;
            this.listView = new ListView(this.$selectBoxGroup,{
                data:that._data(),
                value:that._value,
                onChange:function(value,text){
                    that.input.value(text);
                    that.$element.val(value);
                    that._value = value;
                    that._text = text;
                    that.options.change && that.options.change.call(that);
                }
            });
        },

        /**
         * 获取options定义
         * 1.初始化时定义
         * 2.原始select元素options获取
         * @private
         */
        _data:function(){
            var data = this.options.data;
            if(!data){
                data = [];
                $("option",this.$element).each(function(){
                        var text = $(this).text();
                        var value = this.value;
                        data.push({text:text,value:value});
                    }
                );
            }
            this.options.data = data;
            return data;
        },

        /**
         * 根据value值获取对应的text值
         * @param value
         * @private
         */
        _getTextByValue:function(value){
            var data = this.options.data;
            for(var i= 0,len=data.length; i<len; i++){
                if(data[i].value === value){
                    return data[i].text;
                }
            }
        },

        /**
         * get or set selectBox value
         * @param value
         * @returns {*}
         */
        value:function(value){
            if(arguments.length>0){
                if(value == this._value){
                    return ;
                }
                this._value = value;
                this._text  = this._getTextByValue(value);
                this.$element.val(value);
                this.input.value(this._text);
                this.options.change && this.options.change.call(this);
            }
            else{
                return this._value;
            }
        },

        /**
         * get or set selectBox text
         * @param text
         * @returns {*}
         */
        text:function(text){
            if(arguments.length>0){
                var value = null;
                for(var p in this.options.data){
                    if(p.text === text){
                        value = p.value || "";
                    }
                }
                this._value = value;
                this._text = text;
                this.$element.val(value);
                this.input.value(text);
            }
            else{
                return this._text;
            }
        }
    });

    var ListView = function($parent,options){
        this.options = $.extend({
            data:[],
            onChange:null
        },options);
        this.$options = null;
        this.$parent = $parent;
        this.value = options.value;//下拉框初始值
        this._init();
        this.isOpen = false;
        this.text = null;
    };

    ListView.prototype = {
        /**
         * 初始化下拉选择框
         * @returns {*|HTMLElement}
         * @private
         */
        _init:function(){
            var data = this.options.data;
            var $options = this.$options = $('<ul class="' + OPTIONS + '"></ul>');
            var left = this.$parent.offset().left + 80;
            var top = this.$parent.offset().top + 28;
            if(data){
                for(var i = 0,len = data.length; i<len; i++){
                    $options.append(this._createOption(data[i]));
                }
            }
            this.optionsHeight = $options.height();
            $('body').append($options.css({top:top,left:left}));
            this.optionsHeight = $options.height();
            $options.hide();
        },

        /**
         * 构造单个option
         * @param option
         * @private
         */
        _createOption:function(option){
            var $li = $('<li></li>').text(option.text),
                that = this;
            $li.on("click",function(){
                if(!$li.is("." + SELECTED)){
                    $("li."+SELECTED,that.$options).removeClass(SELECTED);
                    $li.addClass(SELECTED);
                    that.text = option.text;
                    that.value = option.value;
                    that._change();
                }
                that.toggle();
            });
            that.value == option.value && $li.addClass(SELECTED);
            return $li;
        },

        /**
         * 设置position显示时在屏幕中的位置
         * @private
         */
        _setPosition:function(){
            var left = this.$parent.offset().left + 80;
            var top = this.$parent.offset().top + 28;
            this.$options.css({top:top,left:left});
        },

        /**
         * 显示隐藏切换options选择框
         * @private
         */
        toggle:function(){
            var that = this,
                $options = this.$options;
            this._setPosition();
            this.isOpen = !this.isOpen;
            var height = this.isOpen ? this.optionsHeight:0;
            if(this.isOpen){
                $options.height(0);
                $options.show();
            }
            this.$options.velocity({
                    height:height
                },200,
                function(){
                    if(that.isOpen){
                        that._clickBlank();
                    }else{
                        $options.hide();
                    }
                }
            );
        },

        /**
         * 当在非本元素范围内点击，收缩下拉框
         * @private
         */
        _clickBlank:function(){
            var that = this;
            $(document).mouseup(function(e) {
                var _con = that.$parent;
                if (!_con.is(e.target) && _con.has(e.target).length === 0) {
                    that.$options.animate({
                        height:'hide'
                    },200);
                }
            });
        },

        /**
         * 获取options定义
         * 1.初始化时定义
         * 2.原始select元素options获取
         * @private
         */
        _data:function(){
            var data = this.options.data;
            if(!data){
                data = [];
                $("option",this.$element).each(function(){
                        var text = $(this).text();
                        var value = this.value;
                        data.push({text:text,value:value});
                    }
                );
            }
            this.options.data = data;
            return data;
        },

        /**
         * 单击option触发
         * @param e
         * @private
         */
        _change:function(){
            this.options.onChange && this.options.onChange.call(this,this.value,this.text);
        }
    };

    cri.SelectBox = SelectBox;

    $.fn.selectBox = function(option) {
        var o = null;
        this.each(function () {
            var $this = $(this),
                options = typeof option == 'object' && option;
            o = $this.data('selectBox');
            if(o != null){
                o._destory();
            }
            $this.data('selectBox', (o = new SelectBox(this, options)));
        });
        return o;
    };
}(window);