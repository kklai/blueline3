/*jshint unused:false */
/*global $:false, _:false, Hogan:false, Swiper:false */

/*
 * Content module for Boston.com prototype
 * by Pete Karl (@steyblind) c/o Upstatement (@upstatement)
 *
 * This handles 'CMS'-like content loading & infinity scrolling
*/
var bcom_content = (function() {
	'use strict';

	// template names go here,
	// refers to mustache templates
	var template_types = [
		'quick',
		'quick-ads',
		'feature',
		'feature-ads',
		'headlines',
		'article',
		'ads',
		'loading',
		'nav',
		'nav-profile',
		'nav-search',
		'filter-nav',
		'lead-list',
		'lead-nav',
		'lead',
		'comments',
		'error',
		'share',
		'toc',
		'story-gallery',
		'quick-gallery',
		'quick-gallery-popup',
		'page-bottom',
		'story-ad',
		'brand-ad',
		'brand-plain-ad',
		'byline',
		'article-gallery',
		'gallery-preview',
		'image-popup',
		'single-image',
		'circulars',
		'weather',
		'stocks'
	];

	// content types go here,
	// refers to JSON content
	var content_types = [
		'quick',
		'feature',
		'headlines',
		'ads',
		'lead',
		'comments',
		'taboola',
		'quick-ad-config',
		'quick-ad-start-config',
		'quick-ad-mid-config',
		'quick-sponsor-ads',
		'quick-ads',
		'quick-article',
		'feature-article',
		'feat-ad-config',
		'feat-sponsor-ads',
		'ads-big-wide',
		'ads-new-order',
		'ads-big',
		'sections',
		'galleries',
		'story-ad',
		'brand-ad',
		'brand-plain-ad',
		'slides',
		'circulars',
		'weather',
		'stocks'
	];

	var module = {};

	var requests = [];
	var templates = {};
	var content = {};

	// track data indices for pagination/repeating
	var index = {};

	var scrollNode = (document.documentElement || document.body.parentNode || document.body);
	var page_slug = window.location.hash.slice(1);

	module.fetch = function(types, path, ext, cb) {
		_.each(types, function(filename) {
			requests.push(
				$.get(path + filename + '.' + ext).success(function(response) {
					cb.apply(null, [response, filename]);
				})
			);
		});
	};

	var wheight = $(window).outerHeight();

	module.processGallery = function(gallery) {
		gallery.slides = [];
		_.each(content.slides.data, function(slide) {

			if(_.contains(slide.machine_tags, 'curated:' + gallery.curated)) {

				if(gallery.slides.length === 0) {
					slide.is_intro_slide = true;
				}

				gallery.slides.push(slide);
			}
		});
	};

	module.process = function(el) {

		var $el = $(el);
		var mod = $el.data(); // get data for the mod we're dealing with

		// no template, not our problem
		if(mod.template === undefined) {
			return;
		}

		// IF STATIC, DO IT & GET OUT
		if(mod.source === undefined) {
			$el.append( templates[mod.template].render() );
			return;
		}

		var slug;

		// IF WE'RE USING SLUG TO GET ONE ARTICLE, DO IT & GET OUT
		if(mod.source !== undefined && mod.usesSlug === true) {
			if(mod.slug !== undefined) {
				slug = mod.slug;
			} else {
				slug = window.location.hash.slice(1);
			}

			var story = module.lookupContent(mod.source, slug);

			if(mod.template.indexOf('galler') >= 0) {
				module.processGallery(story);
			}

			// remove story from index
			index[mod.source] = _.without(index[mod.source], story);

			$el.append(templates[mod.template].render(story));

			return;
		}

		// WE'RE USING A SLUG TO FILTER A SET OF ARTICLES!
		if(mod.source !== undefined && mod.usesSlugFilter === true && window.location.hash) {
			if(mod.slug !== undefined) {
				slug = mod.slug;
			} else {
				slug = window.location.hash.slice(1);
			}

			var stories = module.filterContent(mod.source, slug);

			if(stories === false) {
				// do 404 for whole page
				return false;
			}

			if(mod.repeat !== undefined && mod.repeat < stories.length) {
				stories = stories.slice(0, mod.repeat);
			}

			_.each(stories, function(story) {
				index[mod.source] = _.without(index[mod.source], story);
				$el.append(templates[mod.template].render(story));
			});

			return;
		}

		// IF WE HAVE A SOURCE, LET US ROCK
		if(mod.source !== undefined) {

			var data, count = 0;

			if(mod.repeat > index[mod.source].length) {
				mod.repeat = index[mod.source].length;
			}

			while(mod.repeat - count) {
				if(mod.order !== undefined && mod.order === 'ignore') {
					data = content[mod.source].data[count];
				} else {
					data = index[mod.source].shift();
				}

				if(data) {
					$el.append(templates[mod.template].render(data));
				}
				count++;
			}
		}
	};

	module.draw = function() {


		var no404 = false;
		$('.ups-template-mod').each(function() {
			var no404 = module.process(this);

			if(no404 === false) {
				window.location.replace("/404.html");
			}

			module.processAds(this);
		});

		// if(no404 === false) {
			// do 404 template
			// $('body').html( templates['error'].render() );
			// return;
		// }

		$('.ups-ad-mod').each(function() {
			module.processAds(this);
		});

		module.drawNavigation();

		// CONTENT DONE

		$('.page-loading').remove();
		$('.page-content, .main-nav, .subnav-mod').css('opacity', 1);

		$('.js-quick-filter').each(function(index, el) {
			$(el).on('click', function(e) {
				e.preventDefault();
				var $this = $(this);

				if($this.data('ignore') === undefined) {
					var $li = $this.closest('li');

					if ($li.parent().hasClass('subnav')) {
						// Put the first quick tease in view ..
						if ($(window).width() >= 600){
							$('.filter-nav-mod')[0].scrollIntoView();
							document.body.scrollTop -= 40;
						} else {
							$('.filter-nav-mod')[0].scrollIntoView();
							document.body.scrollTop += 15;
						}
					}
					// .. and filter!
					$('.js-quick-filter').removeClass('filter-active');
					$('.js-quick-filter-' + $this.data('filters') ).addClass('filter-active');
					module.filter($this.data('filters'));

				}
			});
		});

		module.listen();
	};

	module.drawNavigation = function() {
		// TODO: Talk to Pete about how to tighten this up
		var $elNav = $('.nav-mustache');
		var $el = $('.ups-filter-mod');
		var slug = 'all';

		if(window.location.hash) {
			slug = window.location.hash.slice(1);
		}

		var data = _.find(content.sections.data, {section_id: slug});

		$elNav.append( templates['nav'].render( data ) );
		$el.append( templates['filter-nav'].render( data ) );
	};

	module.reindex = function(source) {
		if(source === undefined) {
			// do all?
			alert('oh no!');
		} else {
			if(content[source].data !== undefined && content[source].data instanceof Array) {
				 // create an indexed copy
				index[source] = content[source].data.slice();
			}
		}
	};

	// similar to module.lookup() except that this gathers
	// ALL stories that have a story.section match to slug
	module.filterContent = function(source, slug, scope) {

		if(source.indexOf(',') >= 0) {
			scope = module.implodeSources(source);
		} else if(scope === undefined) {
			scope = content[source].data;
		}

		if(!slug && !window.location.hash) {
			return scope;
		}

		var stories = [];
		_.each(scope, function(story) {
			if( _.contains(story.section, slug)) {
				stories.push(story);
			}
		});

		if(stories.length) {
			return stories;
		}

		return false;
	};

	// source is data source name, like 'lead'
	// slug is the slug we're looking for
	// returns ONE story.
	// optionally provide a set of JSON data to look through
	module.lookupContent = function(source, slug, scope) {

		var story;
		if(source.indexOf(',') >= 0) {
			scope = module.implodeSources(source);
		} else if(scope === undefined) {
			scope = content[source].data;
		}

		story = _.find(scope, { slug: slug });
		if(story) {
			return story;
		}

		return false;
	};

	// feed me comma-delimited data sources, feeds back
	// one source data array
	module.implodeSources = function(sources) {
		var scope = [];

		_.each(sources.split(','), function(src, i) {
			scope = scope.concat(content[src].data);
		});
		return scope;
	};

	// runs filter on any quick-tz elements based on slug
	// inside of filter URL
	module.filter = function(filter) {

		if(filter === 'all') {
			$('#quick-infinity').removeData('slug');
			$('.quick-tz').show();
			return;
		}

		$('#quick-infinity').data('slug', filter);

		var re = new RegExp(filter, 'i');
		$('.quick-tz').show().each(function(index, el) {
			var section = $(el).data('section');

			if(section) {
				if(!section.match(re)) {
					$(el).hide();
				}
			} else {
				$(el).hide();
			}
		});

		module.processAds($('.quick-tz-mod')[0], true);
		module.checkSecondaryContent($('.quick-tz-mod')[0], true);
	};

	module.processAds = function(el, refresh, adClass) {

		var $el = $(el);
		var mod = $el.data();

		var adTemplate = templates.ads;

		if(mod.adSource === undefined) {
			return;
		}

		if(refresh) {
			$el.find('.ad-mod').remove();
		}

		var adCount = $el.find('.ad-mod').length;
		var ad, adContent = content[mod.adSource].data;

		var nextAdAt = mod.adStart + (adCount * mod.adFreq);

		if(nextAdAt >= $el.children().length) {
			return;
		}

		// new js for 3.6.14 ad ask
		var adPointer = 0;
		// end new js for 3.6.14 ad ask
		$el.children(':visible').each(function(index) {
			if(index === nextAdAt) {



				var content;
				if($('body').hasClass('ads-hp')) {
					// new js for 3.6.14 ad ask
					content = adContent[adPointer];
					adPointer++;

					if(adPointer > adContent.length) {
						adPointer = 0;
					}
				} else {
					// pre 3.6.14 ad randomizer
					content = adContent[Math.floor(Math.random()*adContent.length)];
				}

				if(adClass) {
					content.class = adClass;
				}
				ad = adTemplate.render( content );
				$(this).after(ad);

				nextAdAt = mod.adStart + (adCount++ * mod.adFreq) + mod.adFreq;

				// console.log(index, 'ad inject!', 'count', adCount, 'next', nextAdAt);

			} else {
				// console.log(index);
			}

		});
	};

	module.scrollListen = function() {

		// if(typeof Hammer !== 'undefined' && $('html').hasClass('touch')) {

		// 	module.directionSwipes = {};
		// 	module.directionSwipes['up'] = 0;
		// 	module.directionSwipes['down'] = 0;

		// 	var scrollSwipe = new Hammer(window).on('release', _.debounce(function(e) {
		// 		// console.log('hammer', e, e.gesture.direction, module.directionSwipes);

		// 		if(e.gesture.deltaY < 0) {

		// 			module.directionSwipes['up'] = 0;
		// 			module.directionSwipes['down']++;

		// 			if(module.directionSwipes['down'] >= 2) {
		// 				$('body').removeClass('sticky-nav-active').addClass('sticky-nav-ready');
		// 				// console.log('SETTING READY');
		// 			}

		// 		} else if(e.gesture.deltaY > 0) {

		// 			module.directionSwipes['down'] = 0;
		// 			module.directionSwipes['up']++;

		// 			if(module.directionSwipes['up'] >= 3) {
		// 				$('body').removeClass('sticky-nav-ready').addClass('sticky-nav-active');
		// 				// console.log('SETTING ACTIVE');
		// 			}

		// 		}

		// 		// module.directionSwipes
		// 	}, 20));
		// }

		$(window).on('scroll', _.throttle(function() {

			if($('.quick-tz').length !== 0) {

				if ($(window).width() >= 600){
						var wtop = (window.pageYOffset || scrollNode.scrollTop) + $('.main-nav').height() + 20;
					} else {
						var wtop = (window.pageYOffset || scrollNode.scrollTop) + $('.main-nav').height() - 25;
					}

				if(wtop > $('.filter-nav-mod').offset().top) {
					$('body').addClass('subnav-active').removeClass('tall-nav-potential');
				}
				else {
					$('body').removeClass('subnav-active').addClass('tall-nav-potential');
				}
			}

			// if($(window).scrollTop() < 200) {
			// 		$('body').removeClass('sticky-nav-ready').addClass('sticky-nav-active');
			// 	}

			_.each($('.story-tools-sidecar'), module.fixToContainer);

			// content infinity scroll
			_.each($('.bcom-infinity-scroller'), module.scrollCheck, 50);

		}, 10));

	};

	$('.load-story-trigger').on('click', function(e){
		e.preventDefault();
		if($('.load-story-trigger').hasClass('new-content-alert')) {
			$('body').removeClass('new-content').addClass('new-content-added');
			if ($(window).width() >= 600){
				$('.filter-nav-mod')[0].scrollIntoView();
				document.body.scrollTop -= 40;
			} else {
				$('.filter-nav-mod')[0].scrollIntoView();
				document.body.scrollTop += 15;
			}
		} else {
			$('body').removeClass('new-content').addClass('new-content-added');
		}
	});


	// $('.mr-ad').on('click', function(e){
	// 	$('body').addClass('new-content').removeClass('new-content-added');
	// });
	// makes the nav stick to the top when user scrolls up

	// if($(window).width() < 600 ) {

	// 	var previousScroll = 0,
	// 	    headerOrgOffset = 0;
	// 	    console.log(headerOrgOffset);

	// 	$(window).scroll(function () {
	// 	    var currentScroll = $(this).scrollTop();
	// 	    if (currentScroll >= headerOrgOffset) {
	// 	        if (currentScroll > previousScroll) {
	// 	        	// if (currentScroll > 55) {
	// 		            $('body').addClass('sticky-nav-ready').removeClass('sticky-nav-active');
	// 	        	// }
	// 	        } else {
	// 	            $('body').addClass('sticky-nav-active').removeClass('sticky-nav-ready');
	// 	        }
	// 	    } else {
	// 	    	// $('body').removeClass('sticky-nav-active').removeClass('sticky-nav-ready');
	// 	    }
	// 	    previousScroll = currentScroll;
	// 	});
	// }

	module.fixToContainer = function(el, index) {
		var $this = $(el);
		var $parent = $this.parent();
		var parentTop = $parent.offset().top;
		var parentBottom = parentTop + $parent.height() - $this.outerHeight();
		var wtop = (window.pageYOffset || scrollNode.scrollTop) + $('.main-nav').height() + 50;

		if(wtop <= parentBottom && wtop >= parentTop) {
			if($(window).width() < 900) {
				$this.css('margin-top', 0);
			} else {
				$this.css('margin-top', wtop - parentTop);
			}
		} else if(wtop < parentTop) {
			$this.css('margin-top', 0);
		}
	};

	module.scrollCheck = function(el, index) {

		// TODO: find better places for these - pk

		var wtop = window.pageYOffset || scrollNode.scrollTop || document.documentElement.scrollTop;

		var infinityOffset = 500; // when we're this close, fire the loader
		var $el = $(el);

		if(wtop + wheight + infinityOffset > $el.outerHeight() + $el.offset().top) {
			module.process(el);
			module.processAds(el);
		}
	};

	module.share = function() {

		var quickSwiper, gal;

		$('.popup-trigger').magnificPopup({
			callbacks: {
				open: function() {
					$('#quick-gallery').css('opacity', 0);
					setTimeout(function(){
						$('#quick-gallery').css('opacity', 1);
					}, 250);
					// NOTE: this stuff belongs in bos.galleries.js - pk

					var $modal = $(this.contentContainer[0]);
					var $clicked = $(this.currItem.el);

					// if(!clicked.hasClass('popup-trigger')) {
					// 	clicked = clicked.parents('.popup-trigger:first');
					// }

					var $mod = $modal.find('.ups-template-mod').data('slug', $clicked.data('slug') ).attr('id', 'slug-' + $clicked.data('slug'));
					module.process($mod[0]);

					if(typeof Swiper !== 'undefined' && $clicked.attr('href') !== '#img-popup') {

						quickSwiper = new Swiper('#quick-gallery .swiper-mod', {
							mode:'horizontal',
							speed: 300,
							loop: true,
							fixedContentPos: true,
							keyboardControl: true,
							updateOnImagesReady: true,
							onInit: function(swiper) {
								setQGHeight();
								verticallyCenterQG(swiper.activeSlide());

								// module.processAds($('.qg-gallery-slides')[0], true, 'gallery-slide');
							},
							onSlideChangeStart: function(swiper) {
								verticallyCenterQG(swiper.activeSlide());
							},
							onSlideClick: function(swiper) {
								quickSwiper.swipeNext();
							}
						});
						$('.qg-swiper-mod').find('.swiper-prev').click(function(){ quickSwiper.swipePrev(); });
						$('.qg-swiper-mod').find('.swiper-next').click(function(){ quickSwiper.swipeNext(); });
					}
				},
				close: function() {
					$('.quick-gallery').html('');
					$('.single-img').html('');
					if(typeof Swiper !== 'undefined' && quickSwiper !== undefined) {
						quickSwiper.destroy();
						quickSwiper = null;
					}
				}
			},
		});

		//can be added to any link to close a modal - nh
		$('body').on('click', '.close-modal', function(e){
			$.magnificPopup.close();
		});

		$('.popup-trigger').on('mousedown', function(e) {
			var share_title;
			if( $('.story-h1').length ) {
				share_title = $('.story-h1').text();
			} else if($('.tz-title').length) {
				share_title = $(e.currentTarget).parents('.quick-tz, .feat-tz').find('.tz-title a').text();
			} else {
				share_title = 'I could not find a title';
			}
			$('.share-h').text(share_title);
		});

	};

	function setQGHeight() {
		var targetHeight = $(window).height() - $('.qg-pop-hdr').height() - $('.qg-pop-hgroup').height() - $('.qg-pop-ftr').height() - 150;

		$('.qg-gallery-slides').css('height', targetHeight);
		// carves out space on the top of gallery-img-nav so that qg-pop-hgroup links can still be clicked
		$('.gallery-img-nav').css('top', $('.qg-pop-hgroup').height());
	}

	function verticallyCenterQG (slide) {
		var $qgImg = $(slide).find('.qg-img');
		var swipeHeight = $('.qg-gallery-slides').height();

		var targetHeight = $(window).height() - $('.qg-pop-hdr').height() - $('.qg-pop-hgroup').height() - $('.qg-pop-ftr').height() - 150;

		if ($qgImg.height() < swipeHeight) {
			$qgImg.css('margin', ((swipeHeight - $qgImg.height()) / 2) + 'px auto' );
		}
	}

	module.filterListen = function() {
		$('.ups-refresh-page').off('click').on('click', function(e) {
			console.log('I have been clicked!');
			var hashIndex = $(this).attr('href').indexOf('#');
			if($(this).attr('href') !== window.location.hash) {
				if(hashIndex === 0) {
					window.scrollTo(0);
					window.location.hash = $(this).attr('href');
					window.location.reload();
				} else if(hashIndex > 0) {
					window.location = $(this).attr('href');
					window.location.reload();
				}
			}
		});
	};

	module.secondaryContentListen = function() {
		module.checkSecondaryContent();
		$(window).on('resize', function() {
			wheight = $(window).outerHeight();
			module.checkSecondaryContent();
		});
	};

	module.checkSecondaryContent = function() {
		var $mr = $('#must-reads');
		var $ft = $('#feat-tz');

		if($(document).width() < 960) {
			$mr.insertAfter('.quick-tz:visible:eq(6)');
			$ft.insertAfter('.quick-tz:visible:eq(12)');
		} else {
			$mr.insertAfter('.must-reads-holder');
			$ft.insertAfter('.feat-tz-holder');
		}
	};

	module.listen = function() {
		module.scrollListen();
		module.secondaryContentListen();
		module.filterListen();
		module.share();
	};

	module.init = function() {

		module.fetch(template_types, '/assets/templates/', 'mustache', function(template, source) {
			templates[source] = Hogan.compile(template);
		});

		module.fetch(content_types, '/assets/data/', 'json', function(data, source) {
			content[source] = data;

			module.reindex(source);
		});

		// when the AJAX requests are done, run the rest of the app
		var defer = $.when.apply($, requests);

		defer.done(module.draw);
	};

	return module;

}());
