var CDC = CDC || {};

function getUrlParameter( name ) {
	name = name.replace( /[\[]/, '\\[' ).replace( /[\]]/, '\\]' );
	var regex = new RegExp( '[\\?&]' + name + '=([^&#]*)' );
	var results = regex.exec( location.search );
	return results === null ? '' : decodeURIComponent( results[1].replace( /\+/g, ' ' ) );
}

function requestChatBot() {
	CDC.partnerUrl = getUrlParameter( 'partnerUrl' );
	if ( 0 === CDC.partnerUrl.indexOf( '//' ) ) {
		CDC.partnerUrl = 'https:' + CDC.partnerUrl;
	}
	CDC.language = getUrlParameter( 'language' );
	if ( '' === CDC.language ) {
		CDC.language = 'en-us';
	} else if ( 'es' === CDC.language || 0 === CDC.language.indexOf( 'es-' ) ) {
		CDC.language = 'es-us';
	} else if ( 'ko' === CDC.language || 0 === CDC.language.indexOf( 'ko-' ) ) {
		CDC.language = 'ko-kr';
	} else if ( 'vi' === CDC.language || 0 === CDC.language.indexOf( 'vi-' ) ) {
		CDC.language = 'vi-vn';
	} else if ( 'zh' === CDC.language || 0 === CDC.language.indexOf( 'zh-' ) ) {
		CDC.language = 'zh-cn';
	}

	var wc = document.getElementById( 'webchat' );
	wc.setAttribute( 'class', CDC.language );

	var oReq = new XMLHttpRequest();
	oReq.addEventListener( 'load', initBotConversation );
	var path = '/chatBot?userId=' + Math.random().toString( 36 ).substring( 2 );
	oReq.open( 'POST', path );
	oReq.send();
}

function trackInteraction( interaction ) {
	if ( s && 'function' === typeof s.tl ) {
		var label = 'selfchecker';
		s.linkTrackVars = 'prop5,prop8,prop40,prop49,prop46,prop2,prop31,channel,eVar17';
		s.pageName = null;
		if ( '' !== CDC.partnerUrl ) {
			s.referrer = CDC.partnerUrl;
			s.prop8 = 'Widget';
		}
		if ( '' === CDC.language ) {
			s.prop5 = 'eng';
		} else if ( 'es' === CDC.language || 0 === CDC.language.indexOf( 'es-' ) ) {
			s.prop5 = 'spa';
		} else if ( 'ko' === CDC.language || 0 === CDC.language.indexOf( 'ko-' ) ) {
			s.prop5 = 'kor';
		} else if ( 'vi' === CDC.language || 0 === CDC.language.indexOf( 'vi-' ) ) {
			s.prop5 = 'vie';
		} else if ( 'zh' === CDC.language || 0 === CDC.language.indexOf( 'zh-' ) ) {
			s.prop5 = 'chi';
		} else {
			s.prop5 = 'eng';
		}
		s.prop40 = 'ci-' + label + ': ' + interaction;
		s.tl( true, 'o', label );
	}
}

var cdcFirstBotMessageReceived = false;

function initBotConversation() {
	if ( this.status >= 400 ) {
		alert( this.statusText );
		return;
	}
	// extract the data from the JWT
	var jsonWebToken = this.response;
	var tokenPayload = JSON.parse( atob( jsonWebToken.split( '.' )[1] ) );
	var user = {
		id: tokenPayload.userId,
		name: tokenPayload.userName
	};
	var domain = undefined;
	if ( tokenPayload.directLineURI ) {
		domain = tokenPayload.directLineURI;
	}
	var botConnection = window.WebChat.createDirectLine( {
		token: tokenPayload.connectorToken,
		domain: domain
	} );
	botConnection.activity$.filter( function ( activity ) {
		return 'message' === activity.type;
	} ).subscribe( function ( e ) {
		if ( ! cdcFirstBotMessageReceived ) {
			cdcFirstBotMessageReceived = true;
			$( 'div[class^="react-scroll-to-bottom--css"]' ).css( { 'visibility': 'hidden' } );
			setTimeout( function() {
				$( 'div[class^="react-scroll-to-bottom--css"]' ).scrollTop( 0 );
				// Remove the spinner
				$( '.loader' ).remove();
				$( 'div[class^="react-scroll-to-bottom--css"]' ).css( { 'visibility': 'visible' } );
			}, 500 );
		}
		// capture metrics on the events of interest
		var label = 'selfchecker';
		var interaction = '';
		if ( e.entities && 0 < e.entities.length && 'completion_event' === e.entities[0].name ) {
			trackInteraction( 'completed_' + e.entities[0].message_id.toString() );
		} else if ( e.serviceUrl && ( domain === e.serviceUrl + 'v3/directline' ) ) {
			if ( 'I agree' === e.text || '동의함' === e.text || 'Tôi đồng ý' === e.text || '我同意' === e.text || 'Acepto' === e.text ) {
				trackInteraction( 'started' );
			}
		}
	} );

	var styleOptions = {
		//botAvatarImage: 'https://docs.microsoft.com/en-us/azure/bot-service/v4sdk/media/logo_bot.svg?view=azure-bot-service-4.0',
		botAvatarImage: 'https://www.cdc.gov/TemplatePackage/contrib/widgets/healthBot/covid19/images/cdcLogo.svg',
		botAvatarInitials: 'CDC',
		// userAvatarImage: '',
		userAvatarInitials: 'You',
		hideSendBox: true,
		autoScrollSnapOnPage: true,
		scrollToEndButtonBehavior: 'any'
	};

	var store = window.WebChat.createStore(
		{},
		function ( store ) {
			return function ( next ) {
				return function ( action ) {
					if ( action.type === 'DIRECT_LINE/CONNECT_FULFILLED' ) {
						// Use the following activity to proactively invoke a bot scenario
						store.dispatch( {
							type: 'DIRECT_LINE/POST_ACTIVITY',
							meta: { method: 'keyboard' },
							payload: {
								activity: {
									type: 'invoke',
									name: 'TriggerScenario',
									locale: CDC.language,
									value: {
										trigger: 'en-us' === CDC.language ? 'covid19' : 'covid19_non_eng'
									}
								}
							}
						} );
					}
					return next( action );
				};
			};
		}
	);

	// hawo: Added middleware to disable card if they are not the most recent one
	var attachmentMiddleware = function () {
		return function (next) {
			return function (card) {
				var attachment = card.attachment;
				var activities = store.getState().activities;
				var messageActivities = activities.filter(function (activity) { return activity.type === 'message'; });
				var recentBotMessage = messageActivities.pop() === card.activity;
				console.log( 'attachment', attachment );
				if ( 'application/vnd.microsoft.card.adaptive' === attachment.contentType && 
					attachment.content.actions && 0 < attachment.content.actions.length && 
					( 'Additional information' === attachment.content.actions[0].title ||
						'추가 정보' === attachment.content.actions[0].title ||
						'Thông tin thêm' === attachment.content.actions[0].title ||
						'额外信息' === attachment.content.actions[0].title ||
						'Información adicional' === attachment.content.actions[0].title ) ) {
					return next(card);
				} else {
					switch (attachment.contentType) {
						case 'application/vnd.microsoft.card.adaptive':
							return window.React.createElement(
								window.WebChat.Components.AdaptiveCardContent,
								{
									actionPerformedClassName: 'card__action--performed',
									content: attachment.content,
									disabled: !recentBotMessage
								}
							);
	
						case 'application/vnd.microsoft.card.hero':
							return window.React.createElement(
								window.WebChat.Components.HeroCardContent,
								{
									actionPerformedClassName: 'card__action--performed',
									content: attachment.content,
									disabled: !recentBotMessage
								}
							);
	
						default:
							return next(card);
					};
				}
			};
		};
	};

	var webchatOptions = {
		attachmentMiddleware: attachmentMiddleware,
		directLine: botConnection,
		styleOptions: styleOptions,
		userID: user.id,
		username: user.name,
		locale: CDC.language,
		store: store
	};
	startChat( user, webchatOptions );
}

function startChat( user, webchatOptions ) {
	var botContainer = document.getElementById( 'webchat' );
	window.WebChat.renderWebChat( webchatOptions, botContainer );
}

setInterval( function () {
	// Handle the "None of the above" checkbox(es)
	var checkbox;
	var checkboxNotSay;
	var checkboxNoSymptoms;
	if ( '' === CDC.language ) {
		checkbox = $( 'input[aria-label="None of the above"]' );
		checkboxNotSay = $( 'input[aria-label^="I prefer not to say"]' );
		checkboxNoSymptoms = $( 'input[aria-label^="No symptoms"]' );
	} else if ( 'es' === CDC.language || 0 === CDC.language.indexOf( 'es-' ) ) {
		checkbox = $( 'input[aria-label="Nada de lo anterior"]' );
		checkboxNotSay = $( 'input[aria-label^="Prefiero no decirlo"]' );
		checkboxNoSymptoms = $( 'input[aria-label^="No tiene síntomas"]' );
	} else if ( 'ko' === CDC.language || 0 === CDC.language.indexOf( 'ko-' ) ) {
		checkbox = $( 'input[aria-label="위에 해당 사항 없음"]' );
		checkboxNotSay = $( 'input[aria-label^="말하고 싶지 않음"]' );
		checkboxNoSymptoms = $( 'input[aria-label^="무증상"]' );
	} else if ( 'vi' === CDC.language || 0 === CDC.language.indexOf( 'vi-' ) ) {
		checkbox = $( 'input[aria-label="Không điều nào ở trên"]' );
		checkboxNotSay = $( 'input[aria-label^="Tôi thích không nói ra hơn"]' );
		checkboxNoSymptoms = $( 'input[aria-label^="Không có triệu chứng"]' );
	} else if ( 'zh' === CDC.language || 0 === CDC.language.indexOf( 'zh-' ) ) {
		checkbox = $( 'input[aria-label="以上都不是"]' );
		checkboxNotSay = $( 'input[aria-label^="我宁愿不说"]' );
		checkboxNoSymptoms = $( 'input[aria-label^="无症状"]' );
	} else {
		checkbox = $( 'input[aria-label="None of the above"]' );
		checkboxNotSay = $( 'input[aria-label^="I prefer not to say"]' );
		checkboxNoSymptoms = $( 'input[aria-label="No symptoms"]' );
	}
	for ( var i = 0; i < checkbox.length; i++ ) {
		var cb = $( checkbox[ i ] );
		if ( 'true' !== cb.attr( 'cdc-handler-set' ) ) {
			cb.attr( 'cdc-handler-set', 'true' );
			cb.on( 'click', handleCheckboxClick );
		}
	}
	for ( var i = 0; i < checkboxNotSay.length; i++ ) {
		var cb = $( checkboxNotSay[ i ] );
		if ( 'true' !== cb.attr( 'cdc-handler-set' ) ) {
			cb.attr( 'cdc-handler-set', 'true' );
			cb.on( 'click', handleCheckboxClick );		
		}
	}
	for ( var i = 0; i < checkboxNoSymptoms.length; i++ ) {
		var cb = $( checkboxNoSymptoms[ i ] );
		if ( 'true' !== cb.attr( 'cdc-handler-set' ) ) {
			cb.attr( 'cdc-handler-set', 'true' );
			cb.on( 'click', handleCheckboxClick );		
		}
	}
}, 200 );

function handleCheckboxClick( event ) {
	var cb = $( event.target );
	var parent = cb.parent( 'div' );
	var sibs = parent.prevAll();
	var sibsPrev = parent.prevAll();
	var sibsNext = parent.nextAll();
	if ( cb.prop( 'checked' ) ) {
		sibsPrev.find( 'input[type="checkbox"]' ).each( function( index, elem ) {
				$( elem ).prop( 'checked', false );
				$( elem ).attr( 'disabled', true );
		} );
		sibsNext.find( 'input[type="checkbox"]' ).each( function( index, elem ) {
				$( elem ).prop( 'checked', false );
				$( elem ).attr( 'disabled', true );
		} );
	} else {
		sibsPrev.find( 'input[type="checkbox"]' ).each( function( index, elem ) {
				$( elem ).removeAttr( 'disabled' );
		} );
		sibsNext.find( 'input[type="checkbox"]' ).each( function( index, elem ) {
				$( elem ).removeAttr( 'disabled' );
		} );
	}
}
