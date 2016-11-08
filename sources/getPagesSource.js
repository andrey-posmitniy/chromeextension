function GetScripts(document) {
	var scripts = [];
    var scriptTags = document.getElementsByTagName("script");
    for (var i = 0; i < scriptTags.length; i++) {
		if (scriptTags[i].src) {
			scripts.push(scriptTags[i].outerHTML);
		}
	}
    return scripts;
}
chrome.runtime.sendMessage({
    action: "getScripts",
    source: GetScripts(document)
});
