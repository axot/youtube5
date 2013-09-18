var players = {};

var getFlashvars = function(el) {
	var flashvars = el.getAttribute('flashvars');
	if (!flashvars) {
		if (flashvars = el.querySelector('param[name=flashvars]')) {
			flashvars = flashvars.getAttribute('value');
		}
	}
	return flashvars;
}

document.addEventListener('beforeload', function(event) {
	if (event.target.youtube5allowedToLoad) return;

	var message = {};

	if (event.target instanceof HTMLObjectElement || event.target instanceof HTMLEmbedElement) {
		message.type = 'plugin';
	}
	else if (event.target instanceof HTMLIFrameElement) {
		message.type = 'iframe';
	}
	else if (event.target instanceof HTMLScriptElement) {
		message.type = 'script';
	}
	else {
		event.target.youtube5allowedToLoad = true;
		return;
	}

	/*
	Some websites can have flash checking disabled by adding the following to the getRequestParameter function of swfobject.

	if(c=='detectflash')return'false';
	*/

	message.location = window.location.href;
	message.url = event.url;
	message.flashvars = getFlashvars(event.target);

	// for some reason the url doesn't stay in the event when its passed to the global page, so we have to set it as the message
	var result = canLoad(event, message);

	if (result == 'video') {
		// sometimes both <embed> and <object> will trigger a beforeload event, even after one of the two has been removed
		if (!event.target.parentNode) return;

		event.preventDefault();

		var playerId = Math.round(Math.random()*1000000000);

		// sometimes the scroll dimmensions of the video are zero, so fall back to the designated width and height
		var width = event.target.scrollWidth;
		var height = event.target.scrollHeight;

		if (width == 0 || height == 0) {
			width = event.target.width;
			height = event.target.height;
		}

		event.target.youtube5allowedToLoad = true;

		var flashvars = getFlashvars(event.target);

		var replace = event.target;

		// little hack to get around YouTube's flash detection. This moves the YouTube5 player one node up the dom tree, breaking their code and preventing it from being removed.
		if (replace.parentNode.id === 'player-api' || replace.parentNode.id === 'player-api-legacy') {
			replace = replace.parentNode;
		}

		players[playerId] = newPlayer(replace, width, height);
		loadVideo({ url: event.url, playerId: playerId, flashvars: flashvars });
	}
	else if (result == 'block') {
		event.preventDefault();
	}
	else if (result == 'allow') {
		event.target.youtube5allowedToLoad = true;
	}
}, true);

var injectVideo = function(playerId, meta) {
	meta.volumeCallback = updateVolume;

	// these messages are sent to iframes as well, so check if the requested video actually belongs to this frame
	if (players[playerId]) {
		players[playerId].injectVideo(meta);
	}
};

// Make YouTube load a new page when navigating to a suggested video
document.addEventListener("DOMContentLoaded", function(event) {
	if (getDomain(window.location.href) === "youtube.com") {
		var script = document.createElement("script");
		script.text = "history.pushState = null;";
		document.body.appendChild(script);
	}
}, true);