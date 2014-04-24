/*jshint unused:false */
/*global $:false, _:false, Swiper:false, Hammer:false */

/*
 * Gallery module for Boston.com prototype
 * by Pete Karl (@steyblind) c/o Upstatement (@upstatement)
 */
var bcom_photos = (function() {
	'use strict';

	var module = {};

	module.currentSlide = 0;

	module.init = function() {
		// console.log('init test');
		// Give us feedback when the user is hovering in the Lead Tease so we
		// take action in the CSS, say for showing and hiding arrows
		$('.swiper-mod, .gallery-body-mod')
			.on('mouseenter', function() {
				$(this).addClass('is-hovering');
			}).on('mouseleave', function() {
				$(this).removeClass('is-hovering');
			});

		// Show / Hide Quick Gallery Captions
		$('body').on('click', '.js-show-caption', function(e) {
			e.preventDefault();
			if ($('body').hasClass('caption-active')) {
				$('body').removeClass('caption-active');
				$(this).text('Show caption');
			} else {
				$('body').addClass('caption-active');
				$(this).text('Hide caption');
			}
		});

		// Show / Hide Quick Gallery Share
		$('body').on('click', '.js-qg-share-trigger', function(e) {
			e.preventDefault();
			if ($('body').hasClass('share-active')) {
				$('body').removeClass('share-active');
			} else {
				$('body').addClass('share-active');
			}
		});

		if (typeof Swiper !== 'undefined') {

			var leadSwiper = new Swiper('.swiper-mod', {
				mode: 'horizontal',
				speed: 300,
				loop: true,
				calculateHeight: true,
				onFirstInit: function() {
					bcom_content.filterListen();
				}
			});

			var leadTimeout = 0;

			$('.swiper-prev').click(function() {
				leadSwiper.swipePrev();
			});
			$('.swiper-next').click(function() {
				leadSwiper.swipeNext();
			});

			// Advance slide based on the navigation
			$('.lead-nav-item')
				.on('mouseenter', function() {
					// Find the index of the item we're on ...
					var index = $('.lead-nav-item').index(this);
					// ... change the slide to match the index
					leadTimeout = setTimeout(function() {
						leadSwiper.swipeTo(index);
					}, 300);
				})
				.on('mouseleave', function() {
					clearTimeout(leadTimeout);
				});

			var circSwiper = new Swiper('.circ-mod', {
				mode: 'horizontal',
				speed: 300,
				loop: true,
				autoplay: 5000,
				createPagination: true,
				paginationClickable: true,
				pagination: '.circ-pagination',
				simulateTouch: false
			});

			$('.circ-ftr-btn-left').click(function() {
				circSwiper.swipePrev();
				circSwiper.startAutoplay();
			});
			$('.circ-ftr-btn-right').click(function() {
				circSwiper.swipeNext();
				circSwiper.startAutoplay();
			});

			/* BADASS WEATHER */
			var slides = $('.widget-block');
			var widgetWidth = $('.widget-swiper-container').width(); // .outerWidth()

			var slideWidth = $(slides[0]).width();
			var slidesInView = Math.floor(widgetWidth / slideWidth);

			$(window).on('resize', function() {
				widgetWidth = $('.widget-swiper-container').width();
				slidesInView = Math.floor(widgetWidth / slideWidth);

				if (widgetWidth > (slideWidth * 7)) {
					$('.next-widget-btn').addClass('widget-btn-off');
				} else {
					$('.next-widget-btn').removeClass('widget-btn-off');
				}
			})

			var widgetSwiper = new Swiper('.widget-swiper-container', {
				speed: 300,
				slidesPerView: 'auto',
				scrollContainer: false
			});

			if ((slideWidth * slides.length) < widgetWidth) {
				$('.next-widget-btn').addClass('widget-btn-off');
			} else {
				$('.next-widget-btn').removeClass('widget-btn-off');
			}

			$('.next-widget-btn').click(function(e) {
				e.preventDefault();
				if (widgetSwiper.activeIndex + slidesInView >= slides.length - 1) {
					widgetSwiper.swipeTo(0, 300);
				} else {
					widgetSwiper.swipeTo(widgetSwiper.activeIndex + slidesInView);
				}
			});
		}



		// NON SWIPER GALLERIES

		// navigate with your keys!
		var keyObj = {
			37: function(e) {
				module.currentSlide--;
				redrawSlides();
			},
			39: function(e) {
				module.currentSlide++;
				redrawSlides();
			}
		};

		$(document).on('keydown', function(e) {
			if ($.inArray(e.which + '', Object.keys(keyObj)) >= 0) {
				keyObj[e.which]();
			}
		});
		// added swipe gestures to clickthrough galleries for touch
		if (typeof Hammer !== 'undefined') {

			// console.log('I am a hammer');
			var imgNav = $('.gallery-wrapper');

			// console.log('Hammers assigned');
			var swipeLeft = new Hammer(imgNav).on('swipeleft', function(e) {
				module.currentSlide++;
				redrawSlides();
			});

			var swipeRight = new Hammer(imgNav).on('swiperight', function(e) {
				module.currentSlide--;
				redrawSlides();
			});
		}


		$('.prev-top-btn, .prev-bottom-btn, .swiper-prev').on('click', function(e) {
			e.preventDefault();
			module.currentSlide--;
			redrawSlides();
		});

		$('.next-top-btn, .next-bottom-btn, .swiper-next').on('click', function(e) {
			e.preventDefault();
			module.currentSlide++;
			redrawSlides();
		});

		// if we have a gallery of content on the page, let's show the first item
		if ($('.gallery-wrapper').length) {
			redrawSlides();
		}

		// Several sloppy if statements that automatically turn
		// click gallery into scrolling gallery if window is under 600px - nh
		if ($(window).width() < 600) {
			if ($('.gallery-type').hasClass('click-gallery')) {
				$('.gallery-type').removeClass('click-gallery').addClass('scrolling-gallery scrolling-gallery-fix');
				redrawSlides();
			}
		}

		$(window).resize(function() {
			if ($(window).width() < 600) {
				if ($('.gallery-type').hasClass('click-gallery')) {
					$('.gallery-type').removeClass('click-gallery').addClass('scrolling-gallery scrolling-gallery-fix');
					redrawSlides();
				}
			} else if ($('.gallery-type').hasClass('scrolling-gallery-fix')) {
				$('.gallery-type').addClass('click-gallery').removeClass('scrolling-gallery scrolling-gallery-fix');
				redrawSlides();
			}
		});

		redrawSlides();
	};

	function redrawSlides() {

		if ($('.gallery-type').hasClass('click-gallery') || $('.gallery-type').hasClass('article-gallery')) {
			if (module.currentSlide < 0) {
				module.currentSlide = 0;
				// console.log('we are at the first slide');
			}

			// hide all slides
			$('.gallery-slide').hide();

			// show slides with index of module.currentSlide
			$('.gallery-slides').each(function() {

				var slides = $(this).find('.gallery-slide');

				if (module.currentSlide > (slides.length - 1)) {
					module.currentSlide = slides.length - 1;
				}

				// Added this - nh + tb
				if (module.currentSlide === 0) {
					$('.gallery-type').addClass('first-slide');
				} else {
					$('.gallery-type').removeClass('first-slide');
				}

				var numSlides = $('.gallery-slides:first .gallery-slide').length;

				if ($('.gallery-type').hasClass('num-descend')) {
					$('.slide-num').text(numSlides - module.currentSlide);
				} else if ($('.gallery-type').hasClass('num-ascend')) {
					$('.slide-num').text(module.currentSlide);
				}

				$('.current-page').text(module.currentSlide + 1);
				$('.total-pages').text(numSlides);

				slides.eq(module.currentSlide).show();
				limitSlideSize(slides.eq(module.currentSlide));
			});
		} else if ($('.gallery-type').hasClass('scrolling-gallery')) {
			$('.gallery-slide').show();
		}

		if ($('.story-comments-mod').length) {
			bcom_content.process($('.story-comments-mod').find('.ups-template-mod')[0]);
		}
	}

	// - nh
	function limitSlideSize(slide) {

		var $slide = $(slide);
		var $img = $slide.find('.gallery-img');

		var windowHeight = $(window).height();
		var imgMaxHeight = (windowHeight * 0.6);
		var quickMaxHeight = (windowHeight * 0.6);
		var articleMaxHeight = (400);
		var newArticleHeight = articleMaxHeight * ($img.width() / $img.height());

		var fixedWidth;
		if ($('.gallery-type').hasClass('article-gallery')) {
			fixedWidth = newArticleHeight;
			$img.css('width', fixedWidth + 'px');
		} else {
			fixedWidth = imgMaxHeight * ($img.width() / $img.height());
			$img.css('width', fixedWidth + 'px');
		}
	}

	return module;
}());
