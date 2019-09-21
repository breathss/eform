(function (root, $, factory) {
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define("Eform", [], factory);
    else if (typeof exports === 'object')
        exports["Eform"] = factory();
    else
        root["Eform"] = factory();
})(this, jQuery, function () {
    
    var that;
    var files = {};
    var PICTURE = [];
    // 表单处理类型
    Eform.EmItemType = {
        STRING: {
            title: undefined,
            index: undefined,
            type: undefined,
            desc: undefined,
            extra: undefined,
            onChange: undefined,
            diyRender: undefined,
            required: undefined,
            theme:undefined,
            col: undefined,
            val:undefined,//初始值
            disabled: undefined //是否禁用
        },//字符串
        TEXT:{},//长内容输入
        DATE: { format: 'yyyy-MM-dd' },// 日期类型
        RADIO: { data: []},// 单选枚举模式
        CHECKBOX: { data: []}, //多枚举选择
        FILE: { url: '', limit: 10 },//文件形式, 上传地址，文件限制个数
        SELECT: {
            data:[], muti: false, url: ''
        }
    }
    /*初始化*/
    function Eform(option) {
        var defaultConfig = {
            id: '', //渲染主体
            // 展示字段
            displayFields: [],
            layer: 1,// 表单布局形式，1分栏，2分栏，3分栏，
            mode: 1,// 1.编辑模式、2、预览模式、
            title:'',
            theme:'',// 1,主题 模式 dark
        };
        that= this;
        this.defaultConfig=defaultConfig;
        this.option=$.extend(true,defaultConfig,option);
        return this;
    }

    //属性编辑
    Eform.prototype = {
        // 初始化
        init: function (data,$newDom) {
            var id = this.option.id;
            var $dom
            if ($newDom) {
                $dom = $newDom;
            } else {
                if (id) {
                    if (typeof (id) == "string") {
                        $dom = $('#' + id);
                    } else {
                        $dom = id;
                    }
                }
            }
                $dom.html(that.getHTML());
                that.dom = $dom;
                if (data) {
                    that.setFields(data);
                }
                if($dom.find('#pickfile').length>0){
                that.pickfile = that.createUploader('#pickfile');
                $("#pickfile").parents('div[label]').after('<ul class="thelist"></ul>');
                }
                /*
                * 添加dom事件
                */
                that.initEvent();
         
        },
        changeDom:function($dom){
            this.option.id = $dom;
        },
        initEvent:function(){
            that.dom.off().on("click", 'div[type="SELECT"] >button,div[type="SELECT"] >[filed]', function () {

                var $this = $(this);
                var $pthis = $this.parents('div[type="DW"]');
                var isMyt = $pthis.attr('muti');
                var list = $pthis.find('.menulist'); //.fadeIn(10)
                if (list.attr('loaded')) {
                    if (list.is(":hidden")) {
                        list.fadeIn(100);
                        return;
                    } else {
                        list.fadeOut(100);
                        return;
                    }

                }
                var data = $pthis.attr("data") ? JSON.parse(decodeURIComponent($pthis.attr("data"))) : [];
                var $THIS = $(this);
                var items = data;
                if (items.length > 0 && items[0].index != '') {

                    list.find('ul').html('');
                    data.map(function (e) {
                        var check = isMyt ? '<input type="checkbox" value="' + e.index + '"  title="' + e.title + '">' : "";
                        list.find('ul').append('<li value="' + e.index + '">' + check + e.title + '</li>');
                    });
                    list.fadeIn(10);
                    list.attr("loaded", true);
                }
                list.off().on('click', 'li', function () {
                    var change = function (data) {
                        var handle = that.getFieldConf($pthis.attr("name"), 'onChange');
                        if (handle) {
                            handle.bind(that)(data);
                        }
                    };
                    if (!isMyt) {
                        $pthis.find('[filed]').val($(this).attr('value') + "_" + $(this).text());
                        $pthis.find('[filed]').text($(this).text());
                        change($(this).attr('value'));
                        list.fadeOut(10);
                    } else {
                        var names = [], vals = [];
                        list.find('li input[type="checkbox"]:checked').map(function () {
                            var title = $(this).attr("title");
                            var val = $(this).val();
                            names.push(title);
                            vals.push(val + "_" + title);
                        });
                        $pthis.find('[filed]').val(vals.join(';'));
                        $pthis.find('[filed]').text(names.join(';'));
                        change(vals.join(';'));
                    }
                });

            })
                .on('click', 'div[name][type!="SELECT"]', function () {
                    //公共处理；
                    that.dom.find('.menulist').fadeOut(100);
                })
            
        },
        createUploader: function (domSelector,url, extensions) {
            var uploader = WebUploader.create({
           
                server: url,
                auto: true,
                // 选择文件的按钮。可选。
                // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                pick: domSelector,
                // 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
                resize: false,
                chunked: true,//开启分片上传
                threads: 1,//上传并发数
                accept: {
                    title: '',
                    extensions: (extensions ? extensions : '*'),
                    mimeTypes: '*'
                },
                chunked: true,//分片处理大文件
                chunkSize: 2 * 1024 * 1024,
       
                fileNumLimit: 300,
                fileSizeLimit: 200 * 1024 * 1024,    // 200 M
                fileSingleSizeLimit: 50 * 1024 * 1024    // 50 M
            });
            var dom = $(domSelector).parent();
            // 当有文件被添加进队列的时候
            uploader.on('fileQueued', function (file) {
                //GUID = WebUploader.Base.guid();

                files[file.id] = file;
                $(".queueList").hide(100);
                var $tb = dom.parent('div[label]').next('.thelist');
      
                $tb.append('<li  id="' + file.id + '" data-id="' + file.id + '" >' + file.name + '<button class="js-delete btn" style="float:right;" >删除</button></li>');
                $tb.find('.js-delete').off().on('click', function (e) {
                    var fileId = $(this).parents('li').data('id');
                    uploader.removeFile(files[fileId]);
              
                    delete files[fileId];
                
                    $(this).parents('li').hide();
                });
            });
            // 文件上传过程中创建进度条实时显示。
            uploader.on('uploadProgress', function (file, percentage) {
                var $li = $('#' + file.id),
                    $percent = $li.find('.progress .progress-bar');

                // 避免重复创建
                if (!$percent.length) {
                    $percent = $('<div class="progress ctive">' +
                        '<div class="progress-bar" role="progressbar" style="width: 0%">' +
                        '</div>' +
                        '</div>').appendTo($li).find('.progress-bar');
                }

                $li.find('p.state').text('上传中');

                $percent.css('width', percentage * 100 + '%');
            });

            uploader.on('uploadSuccess', function (file, response) {
                $('#' + file.id).find('p.state').text('已上传');
                $('#' + file.id).attr('data-url', response._raw);
                $('#' + file.id).find('.progress').remove();

            });
            uploader.on('uploadError', function (file) {
                $('#' + file.id).find('p.state').text('上传出错');
            });
            uploader.on('uploadComplete', function (file) {
                $('#span_percent').find('.progress').fadeOut();
                $('#span_percent').parent().hide();
            });
            return uploader;
        },
        destroy:function(){
            this.option = this.defaultConfig;
            this.dom.html('');
        },
        getOpt:function(key){
            var md=  that.option[key];
            return md;
        },
        getFieldConf: function (key, prop) {
            var displa = that.option.displayFields;
            var keyl = displa.filter(function (x) { return x.index == key; });
            if (keyl && keyl.length > 0) {
                if (prop) {
                   return keyl[0][prop];  
                } else {
                    return keyl[0];
                }
            } else {
                return undefined;
            }
        },
        // 设置表单形式
        setMode:function(mode){
            var md = that.getOpt('mode');
            if (mode != md) {
                if (md == 1) {

                }
                if (mode == 2) {

                }
            }
            that.option.mode = mode;
        },
        //设置字段值
        setFields: function (data) {
            if (data) {
                Object.keys(data).map(function (key) {
                    var val=data[key];
                    if (val) {
                        that.setField(key, val);
                    }
                });
            }
        },

        prependDisplayFields: function (colsConfig) {
            var $frm = that.dom.find('.web-form');
            if ($frm && $frm.length > 0) {
                var html = [];
                colsConfig.map(function (itm) {
                    var item = that.renderItem(itm);
                    that.option.displayFields.unshift(itm);
                    html.push(item);
                
                });
                
                $frm.prepend(html.join('\n'));
            }
        },
        // 追加数据展示元素
        appendDisplayFields: function (colsConfig) {
            var $frm = that.dom.find('.web-form');
            if ($frm && $frm.length > 0) {
                colsConfig.map(function (itm) {
                    var item = that.renderItem(itm);
                    that.option.displayFields.push(itm);
                    $frm.append(item);
                    if (itm.val) {
                        that.setField(itm.index, itm.val);
                    }
                });
            }
        },

        // 获取所有的值列表
        getFields: function () {
            var fields = that.option.displayFields;
            var objData = {};
            fields.map(function (e) {
                if (e.index) {
                    var val = that.getField(e.index);
                    if (val) {
                        objData[e.index] = val;
                    }
                }
            });
            return objData;
        },
        getValidForm: function (callback) {
            if (that.dom && that.dom.length > 0) {
                var item = that.dom.find('.web-form >div[name][required = "required"]');
                var msgs = [];
                item.map(function () {
                    var key = $(this).attr('name');
                    var lb = $(this).attr('label');
                    var val = that.getField(key);
                    if (!val) {
                        msgs.push(lb + "不能为空!");
                    }
                });
                if (msgs.length <= 0) {
                    that.hideMsg();
                    var data = that.getFields();
                    callback(data);
                } else {
                    that.showMsg(msgs[0]);
                }
            } else {
                var data = that.getFields();
                callback(data);
            }
        },
        //重置数据结果
        resetFields:function(){

        },
        setTheme: function (theme) {
            if (this.dom) {
                this.dom.find('.web-form').addClass(theme);
            } else {
                this.option.theme = theme;
            }

        },
        // 设置单个字段的值
        setField: function (key, val) {
            if (that.dom && that.dom.length > 0 && val) {
                var item = that.dom.find('.web-form >div[name="' + key + '"]');
                if (item && item.length > 0) {
                    var dtstr = item.attr('data');
                    var type = item.attr("type");
                    if (dtstr) {
                        var data = JSON.parse(decodeURIComponent(dtstr));
                        if (data) {
                            if (typeof (data[0]) != "string") {
                                var re = data.filter(function (e) { return val.indexOf(e.index)>-1; });
                                if (re && re.length > 0) {
                                    val =re.map(function (v) { return v.title; }).join(";");
                                } else {
                                    console.log('Eform:字段'+key+'值'+val+'未在字典中找到匹配!');
                                }
                            }
                        }
                    }
                 
                    if (type == "FILE" ) {
                        if (that.option.mode == 1) {
                            var ValArr = val.split("||");
                            //  item.find('[filed]').append('<ul class="thelist"></ul>');
                            ValArr.map(function (file) {
                                var index = file.lastIndexOf("\/");
                                var fileName = file.substring(index + 1, file.length);
                                that.dom.find('.thelist').append('<li  id="' + file.id + '" data-id="' + file.id + '" >' + fileName + '<button class="js-delete btn" style="float:right;" >删除</button></li>');
                                files[file.id] = file;
                            })
                            item.find('.js-delete').off().on('click', function (e) {
                                var fileId = $(this).parents('li').data('id');
                                uploader.removeFile(files[fileId]);
                                //uploader.addButton({
                                //    id: domSelector
                                //});
                                delete files[fileId];
                                //$(domSelector).show();
                                $(this).parents('li').hide();
                            });
                        } else {
                            if (typeof (val) == "string") {
                                var ValArr = val.split("||");
                                item.find('[filed]').append('<ul class="thelist"></ul>');
                                ValArr.map(function (file) {
                                    var index = file.lastIndexOf("\/");
                                    var fileName = file.substring(index + 1, file.length);
                                    item.find('.thelist').append('<li>' + fileName + '<button   data-file="' + file + '"  class="js-See btn" style="float:right;" >查看</button></li>');
                                });
                                item.off().on('click', '.js-See', function (res) {
                                    var src = $(this).data('file');
                                    var index = src.lastIndexOf(".");
                                    var a = document.createElement('a');
                                
                                    if (a.href) {
                                        a.target = '_blank';
                                        a.click();
                                    }
                                });
                            }
                        }
                        return;
                    }
                    if (that.option.mode == 1) {
                            var type = item.find('[filed]')[0].type;
                            var localName = item.find('[filed]')[0].localName;
                            if (type == "checkbox" || type == "radio") {
                                item.find('[filed][value="' + val + '"]').prop('checked', 'checked');
                            }
                            else if (localName == "pre") {
                                item.find('[filed]').text(val);
                            }
                            else {
                                item.find('[filed]').val(val);
                            }
                    } else {
                        item.find('[filed]').text(val);
                    }
                 
                }
            }
        },
        showMsg:function(val){
            that.dom.find('#msg').show().text(val);
            //setTimeout(function () {
            //    that.hideMsg();
            //},4000);
        },
        hideMsg:function(val){
            that.dom.find('#msg').hide();
        },
        //获取值
        getField:function(key){
            if (that.dom && that.dom.length > 0) {
                var item = that.dom.find('.web-form >div[name="' + key + '"]');
                if (item && item.length > 0) {
                    var confi = that.option.displayFields.filter(function (e) { return e.index == key; })[0];
                    if (that.option.mode == 1 || (confi.disabled === false)) {
                        var type = null;
                        if (item.find('[filed]')[0]) {
                            type = item.find('[filed]')[0].type;
                        } else {
                            if (item.text().trim() == "文件上传") {
                                type = "file";
                            }
                        }
                        if (type == "checkbox" || type == "radio") {
                            var vals = [];
                            item.find('[filed]').map(function () {
                                var vl = $(this).val();
                                if (vl && $(this).prop('checked')) {
                                    vals.push(vl);
                                }
                            });
                            return vals.join(',');
                        } else if (type == "file") {
                            return $.makeArray(item.next('.thelist').find('li')).map(function (e) { return e.dataset.url }).join('||');
                        } else {
                            return item.find('[filed]').val();
                        }
                    }
                }
            }
        },
        //根据配置获取表单配置
        getHTML:function() {
            var fields = that.option.displayFields,
             layer = that.option.layer,// 表单布局形式，1分栏，2分栏，3分栏，
             theme=that.option.theme,// 主题1，2模式
            mode = that.option.mode;// 1.编辑模式、2、预览模式、
            title = that.option.title;
            var htmls = ['<div class="web-form ' + (theme ? theme : '') + ' "  ' + (layer ? 'col=' + layer : '') + ' >'];
            if (title) {
                htmls.push('<h3  class="card"   style="flex: 100%; text-align: center;">' + title + '</h3>');
            }
            htmls.push('<h3 style="flex: 100%;color:red; display:none; padding:5px;   margin: 0px;background:#eee;text-align: center; " id="msg"></h3>');
            fields.map(function (itm) {
                var item = that.renderItem(itm);
                htmls.push(item);
            });
            htmls.push('</div>');
            return htmls.join('\n');
        },
        getFieldProp: function (key,prop) {
            if (that.dom && that.dom.length > 0) {
                var item = that.dom.find('.web-form >div[name="' + key + '"]');
                if (item && item.length > 0 ) {
                    if (item.find('[filed]')[0]) {
                        var props = item.find('[filed]').prop(prop);
                        return props;
                    }
                }
            } else {
                return null;
            }
        },
        
        //渲染单个元素
        renderItem: function (field) {
            // 默认字符串配置
            var defaultOpt =$.extend({},Eform.EmItemType.STRING);
            var op = $.extend(defaultOpt,field);
            if (op.title) {
                if (op.index) {
                    var classname = 'default';
                    if (op.theme) {
                        classname = op.theme;
                    }
                    var $html = $('<div  name="' + op.index + '" class="' + classname + '"><span class="req"  ></span></div>');
                    $html.attr('label', op.title);
                    if (op.col) {
                        $html.attr('col', op.col);
                    }
                    if (op.muti) {
                        $html.attr('muti', op.muti);
                    }
                    
                    if (op.type) {
                        $html.attr('type', op.type);
                    }
                    if (op.desc) {
                        $html.attr('desc', op.desc);
                    } else {
                     
                    }

                    if (op.data) {
                        $html.attr('data', encodeURIComponent(JSON.stringify(op.data)));
                    }
                    if (that.option.mode == 2 && (op.disabled !== false)) {
                        $html.append('<pre filed></pre>');
                        return $html[0].outerHTML;
                    }
                    if (op.required) {
                        $html.attr('required', op.required);
                    }

                    if (op.disabled) {
                        $html.append('<pre filed  class="disabled">' + (op.val?op.val:'') + '</pre>');
                        return $html[0].outerHTML;
                    }
                    if (op.diyRender) {
                        $html.append(op.diyRender(op));
                    } else {
                        switch (op.type) {
                            case 'DATE':
                                if (op.format) {
                                    $html.append('<input filed  placeholder="请输入' + op.title + '"  onclick="WdatePicker({dateFmt:\'' + op.format + '\'})" readonly="readonly"><i class="calendar-picker-icon"><svg viewBox="64 64 896 896" class="" data-icon="calendar" width="2em" height="1.5em" fill="currentColor" aria-hidden="true"><path d="M880 184H712v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H384v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H144c-17.7 0-32 14.3-32 32v664c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V216c0-17.7-14.3-32-32-32zm-40 656H184V460h656v380zM184 392V256h128v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h256v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h128v136H184z"></path></svg></i>');
                                } else {
                                    $html.append('<input filed placeholder="请输入' + op.title + '"  onclick="WdatePicker()" readonly="readonly"><i class="calendar-picker-icon"><svg viewBox="64 64 896 896" class="" data-icon="calendar" width="2em" height="1.5em" fill="currentColor" aria-hidden="true"><path d="M880 184H712v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H384v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H144c-17.7 0-32 14.3-32 32v664c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V216c0-17.7-14.3-32-32-32zm-40 656H184V460h656v380zM184 392V256h128v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h256v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h128v136H184z"></path></svg></i>');
                                }
                                break;
                            case 'RADIO':
                                if (op.data) {
                                    var $con =$('<label></lable>');
                                    $con.append(op.data.map(function (im,ir) {
                                        if (typeof (im) == "string") {
                                            return '<label  style="padding:0 10px; " ><input filed  style=" margin-bottom: 2px; " ' + (ir == 0 ? "checked" : "") +'  name="abc" value="' + im + '" type="radio" > ' + im + '</label>'
                                        } else {
                                            return '<label  style="padding:0 10px; "><input filed style=" margin-bottom: 2px; "   ' + (ir == 0 ? "checked" : "") +' name="abc" value="' + im.index + '" type="radio" > ' + im.title + '</label>'
                                        }
                                    }).join('\n'));
                                    $html.append($con);
                                }
                                break;
                            case 'CHECKBOX':
                                if (op.data) {
                                    var $con = $('<label></lable>');
                                    $con.append(op.data.map(function (im) {
                                        if (typeof (im) == "string") {
                                            return '<label style="padding:0 10px; "><input  filed value="' + im + '" type="checkbox" > ' + im + '</label>'
                                        } else {
                                            return '<label style="padding:0 10px; "><input filed  value="' + im.index + '" type="checkbox" > ' + im.title + '</label>'
                                        }
                                    }).join('\n'));
                                    $html.append($con);
                                }
                                break;
                            case 'FILE':
                                $html.append('<div style="width:100px;"> <p id="pickfile" class="btn" >文件上传</p> </div>'); // multiple="multiple"
                                break;
                            case 'TEXT':
                                $html.append('<textarea filed  placeholder="请输入' + op.title + '"  rows='+(op.rows?op.rows:3)+' />');
                                break;
                            // case 'SELECT':
                            //     var $con = $('<select  filed></select>');
                            //     if (op.data) {
                            //         $con.append(op.data.map(function (im) {
                            //             if (typeof (im) == "string") {
                            //                 return '<option   value="' + im + '"  > ' + im + '</option>'
                            //             } else {
                            //                 return '<option  value="' + im.index + '" > ' + im.title + '</option>'
                            //             }
                            //         }).join('\n'));
                            //     }
                            //       $html.append($con);
                            //       break;
                            case "NUMBER":
                                $html.append(' <input filed  oninput="this.value=this.value.replace(/[\\D]/g,\'\');">');
                                break;

                            case "SELECT":
                                $html.append('<pre filed  value="'+(op.val?op.val:'')+'"   readonly="readonly" placeholder="请选择' + op.title + '" /><button  style="flex:0.15;">选择</button><div class="menulist"><input placeholder="输入检索条件进行检索"><ul><li>无选择数据列</li></ul></div>');
                                break;
                        
                            case 'STRING':
                            default:
                                $html.append('<input filed  placeholder="请输入'+op.title+'" />');
                                break
                        } 
                      
                    }
                    if (op.extra) {
                        $html.append(op.extra);
                    }
                    //  <input onclick="WdatePicker()" readonly="readonly">
                    return $html[0].outerHTML;
                } else {
                    //分类标题
                    return '<h3  style="flex: 100%; text-align: center;">' + op.title + '</h3>';
                }
            }
        }
    }

    return Eform;
})