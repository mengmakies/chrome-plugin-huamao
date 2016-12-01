// 后端云配置
AV.init({
	appId: 'Sfwa6nyMhQ6TWK1vnIteSVnf-gzGzoHsz',
	appKey: 'dIUA56iTwM3NgfbbiLKPQdBT'
});

var proData = {};
proData.error = "加载中...";
chrome.runtime.onMessage.addListener(function(request, sender, sendRequest){
	console.log('已经接收消息~');

	if(request.type!=='product') return;
	proData = request;
	proData.firstAccess = "获取中...";
	if(!proData.error){
		saveProductData(proData);
	}
});

// 上传商品价格数据
var saveProductData = function (proData) {

	var today = new Date();
	var strToday = today.toLocaleDateString();

	// 如果服务器上已经保存有该商品今天的数据，则不再重复采集
	var query = new AV.Query('Product');
	query.equalTo('proId', proData.proId);
	query.equalTo('saveDate', strToday);// 每天存一条记录
	query.find().then(function (results) {
		if(results.length > 0) return;

		var Product = AV.Object.extend('Product');
		var data = new Product();

		data.set('proId', proData.proId);
		data.set('saveDate', strToday);
		data.set('title', proData.title);
		data.set('url', proData.url);
		data.set('auPrice', proData.auPrice);
		data.set('rmbPrice', proData.rmbPrice);
		data.save().then(function (todo) {
			// 成功保存之后，执行其他逻辑.
			console.log('New object created with objectId: ' + data.id);
		}, function (error) {
			// 异常处理
			console.error('Failed to create new object, with error message: ' + error.message);
		});

	}, function (error) {
		console.error('保存数据出错~');
	});

};
