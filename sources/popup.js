$(function() {

	var ViewModel = function () {
		var self = this;
		self.url = ko.observable();
		self.walkmeEnabled = ko.observable(false);
		self.userId = ko.observable();
		self.env = ko.observable();
		self.isHttps = ko.observable(false);
		self.host = ko.observable();
		self.async = ko.observable();
		self.libFile = ko.observable();
		self.dataFiles = ko.observableArray();

		self.walkmeEnabledText = ko.computed(function () {
			return self.walkmeEnabled() ? 'enabled' : 'disabled';
		});
		
		self.processTabContent = function(scriptTags) {
			if (!scriptTags || !scriptTags.length) { return; }
			//console.log(scriptTags);
		
			var walkmeRegexp = /<script.*src="(?:http(?:s?):\/\/)(.*)\/users\/(\w*)\/walkme_(?:(\w)\/)?.*".*(?:<\/script>|\/>)/g;
			for (var i = 0; i < scriptTags.length; i++) {
				var tag = scriptTags[i];
				
				var match = walkmeRegexp.exec(tag);
				if (match != null) {
					self.walkmeEnabled(true);
					if (tag.indexOf('async') > 0) {
						self.async(true);
					}
					if (tag.indexOf('_https.js') > 0) {
						self.isHttps(true);
					}

					var userId = match[2];
					self.userId(userId);
					var env = match[3] ? match[3] : 'Production';
					self.env(env);
					var host = match[1];
					self.host(host);
					
					//setTimeout(function () { // for debugging
					loadSettingsFile(userId);
					//}, 3000);
					
					break;
				}
			}
		};
		
		function loadSettingsFile(userId) {
			// https://s3.amazonaws.com/s3.maketutorial.com/users/7a75f78cb4644e4188ad82d063b1f54b/settings.txt
			// https://s3.amazonaws.com/s3.maketutorial.com/users/8269c9a8a03742678343e645d0e18c24/settings.txt
			var settingsFileUrl = 'https://s3.amazonaws.com/s3.maketutorial.com/users/' + userId + '/settings.txt';
			
			$.ajax({
				url: settingsFileUrl,
				dataType: "jsonp",
				jsonp: false, 
				jsonpCallback: "fixedCallback",
				success: function( response ) {
					console.log(response);
					self.processSettings(response);
				}
			});			
		}
		
		self.processSettings = function(settingsObject) {
			if (!settingsObject) { return; }
			self.libFile(settingsObject.LibFile);
			self.dataFiles(settingsObject.DataFiles);
		}
		
		
		return self;
	};
	var model = new ViewModel();
	window.wmModel = model; // for debugging
	ko.bindingProvider.instance = new ko.secureBindingsProvider();
	ko.applyBindings(model);


	chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
		var activeTab = arrayOfTabs[0];
		var url = activeTab.url;
		model.url(url);
	});


	var scripts = document.querySelector('#scripts');
	chrome.runtime.onMessage.addListener(function(request, sender) {
		if (request.action == "getScripts") {
			//scripts.innerText = request.source;
			model.processTabContent(request.source);
		}
	});
	chrome.tabs.executeScript(null, 
		{ file: "getPagesSource.js" },
		function() {
			// If you try and inject into an extensions page or the webstore/NTP you'll get an error
			if (chrome.runtime.lastError) {
				//scripts.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
				model.processTabContent([]);
			}
		});
	
});
