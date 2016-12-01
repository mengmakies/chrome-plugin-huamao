loadJsCssfile('content.css','css');

// 后端云存储
AV.init({
    appId: 'Sfwa6nyMhQ6TWK1vnIteSVnf-gzGzoHsz',
    appKey: 'dIUA56iTwM3NgfbbiLKPQdBT'
});

collectPriceData();// 采集数据
appendPriceContainer();// 显示统计图

// 统计图配置：置空
var _nullOption = {
    title: {
        subtext: ''
    },
    series: [{
        data: []
    }]
};

// 统计图配置：默认
var _defaultOption = {
    backgroundColor:'#FEF8EF',
    title: {
        top: 0,
        subtext: ''
    },
    grid: {
        top:100
    },
    tooltip: {
        trigger: 'axis'
    },
    toolbox: {
        show: true,
        feature: {
            dataView: {
                readOnly: false
            },
            magicType: {
                type: ['line', 'bar']
            },
            restore: {},
            saveAsImage: {}
        }
    },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: []
    },
    yAxis: {
        type: 'value',
        axisLabel: {
            formatter: '￥{value}'
        }
    },
    series: [{
        name: '价格',
        type: 'line',
        data: [],
        markPoint: {
            data: [{
                type: 'max',
                name: '最高价'
            }, {
                type: 'min',
                name: '最低价'
            }]
        },
        markLine: {
            data: [{
                type: 'average',
                name: '均价'
            }]
        }
    }]
};
var _echart = initChart();

function loadJsCssfile(filename,filetype){

    if(filetype == "js"){
        var fileref = document.createElement('script');
        fileref.setAttribute("type","text/javascript");
        fileref.setAttribute("src",chrome.extension.getURL(filename));
    }else if(filetype == "css"){

        var fileref = document.createElement('link');
        fileref.setAttribute("rel","stylesheet");
        fileref.setAttribute("type","text/css");
        fileref.setAttribute("href",chrome.extension.getURL(filename));
    }
    if(typeof fileref != "undefined"){
        document.getElementsByTagName("head")[0].appendChild(fileref);
    }

}

function initChart() {
    // 基于准备好的dom，初始化echarts实例
    var chart = echarts.init(document.getElementById('price-stat'));

    // 显示标题，图例和空的坐标轴
    chart.setOption(_defaultOption);

    return chart;
}

// 采集数据
function collectPriceData() {
    // 热销top5列表
    $('.category-hot-sell li').each(function (i, item) {
        var priceSpan = $(item).find('.hot-sell-price');

        // 获取价格
        var numReg=/(\d{1,8}\.{0,1}(\d{1,2})?)/g;
        var matchPrice = priceSpan.html().match(numReg);
        var auPrice = matchPrice[0];
        var rmbPrice = matchPrice[2];

        // 获取ID、名称、url
        var aProduct = $(item).find('.product-link');
        var pName = aProduct.html();
        var url = "http://www.huamao.com.au/" + aProduct.attr('href');
        var matchID = url.match(numReg);
        var id = matchID[0];

        var product = {
            type:'product',
            proId: parseInt(id),
            title : pName,
            url : url,
            auPrice : parseFloat(auPrice),
            rmbPrice:  parseFloat(rmbPrice)
        };
        chrome.runtime.sendMessage(product);

        // 显示比价按钮
        appenButton(priceSpan, id);
    });

    // 普通商品列表
    $('.product-list-box .product-info').each(function (i, item) {

        var numReg=/(\d{1,8}\.{0,1}(\d{1,2})?)/g;

        var title = $(item).find('.product-title').html();
        var url = "http://www.huamao.com.au/" + $(item).find('.product-title').attr('href');
        var matchID = url.match(numReg);
        var id = matchID[0];
        var auPrice = $(item).find('.price-num:eq(1)').html().replace(',','');
        var rmbPrice = $(item).find('.price-num:eq(4)').html().replace(',','');

        var product = {
            type:'product',
            proId: parseInt(id),
            title : title,
            url : url,
            auPrice : parseFloat(auPrice),
            rmbPrice:  parseFloat(rmbPrice)
        };
        chrome.runtime.sendMessage(product);

        // 显示比价按钮
        appenButton($(item).find('.price'),id);
    });
}

// 在价格旁边，显示比价按钮
function appenButton(ele, id) {
    ele.append('<img class="img-stat" data-id="' + id + '" src="http://ac-sfwa6nym.clouddn.com/f690f6a02b52af8abc9f.png" title="比价"/>');
}

// 控制统计图控件的显示/隐藏
function appendPriceContainer() {
    $('body').append('<div class="price-stat" style="width: 60px; background-color: transparent;"><div id="price-stat" style="width: 590px;height: 380px;left:-245px;"></div></div>');

    var offset = $('.price-stat').width()/2;

    $('.img-stat').hover(function (e) {
        var proId = $(this).attr('data-id');
        loadProductData(parseInt(proId));
        $('.price-stat').css({'top':e.pageY,'left':e.pageX-offset}).show();
    },function () {
        $('.price-stat').hide();
    });

    $('.price-stat').hover(function () {
        $(this).show();
    },function () {
        $(this).hide();
    });
}

// 加载商品数据到统计图中
var loadProductData = function (proId) {

    _echart.setOption(_nullOption);
    _echart.showLoading();

    var query = new AV.Query('Product');
    query.equalTo('proId', proId);
    query.ascending('saveDate');
    query.find().then(function (results) {
        _echart.hideLoading();
        if(results.length < 1) return;

        var title = results[0].get('title');
        var dates = [];
        var prices = [];
        for(i=0;i<results.length;i++){
            var item = results[i];
            dates.push(item.get('saveDate').substring(5));
            prices.push(item.get('rmbPrice'));
        }

        // 指定图表的配置项和数据
        var option = {
            title: {
                subtext: title
            },
            xAxis: {
                data: dates
            },
            series: [{
                data: prices
            }]
        };

        // 使用刚指定的配置项和数据显示图表。
        _echart.setOption(option);

    }, function (error) {
        console.error('保存数据出错~');
    });
};