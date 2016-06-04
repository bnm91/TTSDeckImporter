$(document).ready(function(){
	var options = ['Cool Basic','Sideboard','Commander'];
	var isActive = [true, false, false];
	var badLines = {};

	var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

	$('body').on('dragover', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var dataTransfer = e.dataTransfer || e.originalEvent.dataTransfer;
        dataTransfer.dropEffect = 'copy';
    });

	$('body').on('drop', function(e){
		e.preventDefault();
        var dataTransfer = e.dataTransfer || e.originalEvent.dataTransfer;
		console.log('Got a drop ' + JSON.stringify(dataTransfer));
		var files = dataTransfer.files;
		console.log('files: ' + JSON.stringify(files));
		for(var i = 0; i < files.length; i++){
			var file = files[i];
			var reader = new FileReader();
			reader.onload = function(e2) {
				var deck = JSON.parse(e2.target.result);
				LoadDeck(deck);
			}
			reader.readAsText(file);
		}
	});

	$('.qualityButtons button').click(function(event){
		$('.qualityButtons button').removeClass('btn-info').addClass('btn-default');
		$(event.currentTarget).addClass('btn-info').removeClass('btn-default');
	});

	$('.toggleButton').click(function(event){
		var src = $(event.currentTarget);
		var active = src.hasClass('btn-success');
		var oldClass = active ? 'btn-success' : 'btn-default';
		var newClass = active ? 'btn-default' : 'btn-success';
		src.removeClass(oldClass).addClass(newClass);

		var btnText = src.text();

		for(var i = 0; i < options.length; i++){
			if(new RegExp(options[i]+'$').test(btnText)){
				isActive[i] = !active;
			}
		}
		UpdateSections();
	});
	
	$('#generate').click(function(){
		$('body').addClass('loading');
		var list = 'MAINBOARD\n'+$('.userlist.mainboard').val();
		if(isActive[1]){
			list += '\nSIDEBOARD\n'+$('.userlist.sideboard').val();
		}
		if(isActive[2]){
			list += '\nCOMMANDER\n'+$('.userlist.commander').val();
		}
		
		var backURL = $('#backURL').val().trim();
		var hiddenURL = $('#hideURL').val().trim();
		var deckName = $('#deckName').val().trim().length > 0?$('#deckName').val().trim():'frogtown_deck';
		var coolify = $('#coolify').hasClass('btn-success');
		var compression = $(".qualityButtons .btn-info").attr("value");
		var name = $('#deckName').val().trim();
		
		var reqobj = {};
		reqobj.decklist = list;
		reqobj.backURL = backURL;
		reqobj.hiddenURL = hiddenURL;
		reqobj.deckName = deckName;
		reqobj.coolify = coolify;
		reqobj.compression = compression;
		reqobj.name = name;
		
		$.ajax({
			type: 'POST',
			url: '/newdeck',
			data: reqobj,
			timeout: 10000,
		}).done(function(dataraw){
			var data = JSON.parse(dataraw);
			if(data.status == 0){
				window.location = '/deck.html?deck='+data.name+'.json&name='+deckName;
			}else{
				console.log(data);
				badLines = {};
				var errMsg = data.errObj.message;
				if(data.errObj && data.errObj.badCards){
					for(var erri = 0; erri < data.errObj.badCards.length; erri++){
						badLines[data.errObj.badCards[erri]]=true;
					}
				}

				console.log(data.errObj);
				$('.error').text(errMsg);
				
				$('.userlist').each(function(i, src){ UpdateErrors($(src)); });
				$('body').removeClass('loading');
				$('.error').removeClass('hidden');
			}
		}).fail(function(){
			$('body').removeClass('loading');
			$('.error').removeClass('hidden');

			$('.error').text('Server is down :(');
		});
	});

	function LoadDeck(deck){
		$('.cmdbtn, .sidebtn').each(function(i,btn){
			if($(btn).hasClass('btn-success'))$(btn).click();
		});

		for(var i = 0; i < deck.ObjectStates.length; i++){
			var state = deck.ObjectStates[i];
			if(state.Nickname == 'Tokens') {

			} else if(state.Nickname == 'Commander'){
				//gotem!
				var commander = state.ContainedObjects[0].Nickname;
				if(!$('.cmdbtn').hasClass('btn-success')) $('.cmdbtn').click();
				$('.userlist.commander').text(commander);
			} else  if(state.Nickname == 'Sideboard'){
				if(!$('.sidebtn').hasClass('btn-success')) $('.sidebtn').click();

				var cards = {};
				for(var obji = 0; obji < state.ContainedObjects.length; obji++){
					var obj = state.ContainedObjects[obji];
					cards[obj.Nickname] = cards[obj.Nickname] || 0;
					cards[obj.Nickname]++;
				}
				var cardText = '';
				for(var cardName in cards){
					cardText += cards[cardName] + ' ' + cardName + '\r\n';
				}
				$('.userlist.sideboard').text(cardText);
			} else {
				$('#deckName').val(state.Nickname);
				console.log('Name: ' + state.Nickname);

				var cards = {};
				for(var obji = 0; obji < state.ContainedObjects.length; obji++){
					var obj = state.ContainedObjects[obji];
					cards[obj.Nickname] = cards[obj.Nickname] || 0;
					cards[obj.Nickname]++;
				}
				var cardText = '';
				for(var cardName in cards){
					cardText += cards[cardName] + ' ' + cardName + '\r\n';
				}
				$('.userlist.mainboard').text(cardText);
			}
		}
		$('.userlist').each(function(i, src){ UpdateErrors($(src)); });
	}

	function UpdateErrors(src){
		src.siblings('.displaylist').val(src.val());
		var listi = 0;
		if(src.hasClass('sideboard'))listi=1;
		if(src.hasClass('commander'))listi=2;

		var errorval = '';
		var curLines = src.val().split('\n');
		console.log('updating errors');
		console.log(JSON.stringify(curLines));
		console.log(JSON.stringify(badLines));
		for(var i = 0; i < curLines.length; i++){
			if(badLines[curLines[i].trim()]){
				if(isChrome){
					errorval += curLines[i] + '\n';
				}else{
					errorval += '*\n'; 
				}
			}else{
				errorval += '\n';
			}
		}

		src.siblings('.errorlist').val(errorval);
		src.siblings('.displaylist,.errorlist').scrollTop(src.scrollTop());
	}

	$('textarea.userlist').bind('input propertychange', function(event) {
		var src = $(event.currentTarget);
		UpdateErrors(src);
	});

	$('textarea.userlist').bind('scroll', function(event) {
		var src = $(event.currentTarget);
		src.siblings('.displaylist,.errorlist').scrollTop(src.scrollTop());
	});

	function UpdateSections(){
		$(".optionalList").addClass("hidden");
		if(isActive[1]) $("#sideboard").removeClass("hidden");
		if(isActive[2]) $("#commander").removeClass("hidden");
		UpdateTextareas()
	}

	function UpdateTextareas(){
		if(isChrome){
			var boards = ['.mainboard','.sideboard','.commander'];
			for(var i = 0; i < boards.length; i++){
				var board = boards[i];

				var displaylist = $(board+'.displaylist');
				var errorlist = $(board+'.errorlist');
				var userlist = $(board+'.userlist');

				errorlist.width(userlist.width());
				errorlist.height(userlist.height());

				displaylist.width(userlist.width());
				displaylist.height(userlist.height());
			}
		}else{
			$('.displaylist').remove();
			$('.errorlist').addClass('notchrome').prop('disabled',true);

			var boards = ['.mainboard','.sideboard','.commander'];
			for(var i = 0; i < boards.length; i++){
				var board = boards[i];

				var errorlist = $(board+'.errorlist');
				var userlist = $(board+'.userlist');

				errorlist.width(userlist.width());
				errorlist.height(userlist.height());
			}
		}
	}

	UpdateTextareas();
	setTimeout(UpdateTextareas, 100);
});