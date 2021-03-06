/*jshint unused:false */
/*global $:false, _:false, Hogan:false */

/*
 * Nav module for Boston.com prototype
 * by Tito Bottitta + Pete Karl c/o Upstatement (@upstatement)
 * 
 * This handles nav/TOC behaviors like opening and closing, etc.
*/
var bcom_nav = (function() {
	'use strict';

	var module = {};

	module.active = false;
	module.states = {
		'toc': 'toc-active',
		'profile': 'profile-active',
		'search': 'search-active'
	};

	module.panels = {
		'toc': $('.toc-mod'),
		'search': $('.search-mod'),
		'profile': $('.nav-profile-mod')
	};

	module.updateBodyState = function(state) {
		module.clearBodyState();

		if(state !== module.active) {
			module.active = state;
			$('body').addClass(module.states[state]);
		} else {
			module.active = false;
		}
	};

	module.clearBodyState = function() {
		_.each(module.states, function(s) {
			$('body').removeClass(s);
		});
	};

	module.init = function() {
			
		$('.js-toc-trigger').on('click', function() {
			module.updateBodyState('toc');
			return false;
		});

		$('.js-search-trigger').on('click', function() {
			module.updateBodyState('search');
			return false;
		});

		$('.js-profile-trigger').on('click', function() {
			module.updateBodyState('profile');
			return false;
		});

		$('.site-container').on('click', function(e){
			if(e.target !== $('.nav-search-mod')[0] && !$.contains( $('.nav-search-mod')[0], e.target ) ) {
				module.active = false;
				module.clearBodyState();
			}
		});

		if(typeof Hammer !== 'undefined' && $('html').hasClass('touch')) {
		    var swipeLeft = new Hammer($('body')).on('swipeleft', function(e) {
				if(e.target !== $('.nav-search-mod')[0] && !$.contains( $('.nav-search-mod')[0], e.target ) ) {
					module.active = false;
					module.clearBodyState();
				}
		    });
		    var swipeRight = new Hammer($('body')).on('swiperight', function(e) {
				if(
					e.target !== $('.nav-search-mod')[0] 
					&& !$.contains( $('.nav-search-mod')[0], e.target) 
					&& !$.contains( $('#feat-tz')[0], e.target)
					&& $('body').hasClass('subnav-active')) {
					module.updateBodyState('toc');
					return false;
				}
		    });
	    }
	};

	// if ($('.main-nav').hasClass('section-front')){
	// 	console.log('test');
	// 	$('body').addClass('section-front');
	// } else {
	// 	$('body').removeClass('section-front');
	// }

	return module;

}());