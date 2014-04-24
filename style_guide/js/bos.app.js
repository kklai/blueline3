/*jshint unused:false */
/*global $:false, bcom_content:false, bcom_nav:false, bcom_photos:false */

'use strict';

/*
 * App module for Boston.com prototype
 * by Pete Karl (@steyblind) c/o Upstatement (@upstatement)
*/
$(function() {

    $(document).unbind('bcom.scroll');

    // Must Reads: Toggle Open/Closed
    function initMustReadsToggle() {

        var $mod = $('.must-reads');
        var $btn = $('.mr-btn');

        function mrOpen() {
            $btn.text('Show Fewer');
            $mod.removeClass('mr-closed');
        }

        function mrClose() {
            $btn.text('Show All');
            $mod.addClass('mr-closed');
        }

        // Open/close Must Reads module on click
        $('.mr-btn').click(function(e){
            e.preventDefault();
            $mod.toggleClass('mr-open');
            if ($mod.hasClass('mr-open')) {
                mrOpen();
            } else {
                mrClose();
            }
        });
    } // initMustReadsToggle

    function initQuickVideoToggle() {

        // var $mod = $('.video-tz');
        var iframe = '<iframe class="video-embed" src="//www.youtube.com/embed/3XPuj-ESf3E?autoplay=1" frameborder="0" allowfullscreen></iframe>';

        $('.js-trigger-quick-video').on('click', function(e){
            e.preventDefault();
            var $mod = $(this).closest('.video-tz');
            var $video = $mod.find('.quick-tz-img-mod');

            // close all other videos
            closeVideos();

            $mod.addClass('video-open');

            $video.animate({
                width: 100 + '%'
            }, {
                duration: 300,
                complete: function() {
                    $mod.find('.video-bucket').html(iframe);
                }
            });
        });
        $('.close-video-link').on('click', function(e){
            e.preventDefault();
            closeVideos();
        });
    }

    function closeVideos() {
        // closes all videos
        $('.video-tz').removeClass('video-open');
        $('.video-tz').find('.video-bucket').html('');
        $('.video-tz').add('.video-bucket').add('.js-trigger-quick-video').attr('style', '');
    }

    // Comments: Jumps to Comments and Shows/Hides
    // TODO: Figure out where this should live -tito
    function initCommentControls() {

        // Check that we're on an article page before
        // trying to create these variables
        if($('body').hasClass('page-story')) {
            var $page_mod = $('.page-story');
                $comment_mod = $('.story-comments-mod');
                $comment_btn = $('.view-comments');
        }

        function openComments() {
            $page_mod.addClass('comments-open').removeClass('comments-closed');
            $comment_mod.addClass('is-open').removeClass('is-closed');
            $comment_btn.text("Hide");
        };

        function closeComments() {
            $page_mod.addClass('comments-closed').removeClass('comments-open');
            $comment_mod.addClass('is-closed').removeClass('is-open');
            $comment_btn.text("View");
        };

        function toggleComments() {
            // Open the comments if they're closed
            if ($page_mod.hasClass('comments-closed')) {
                openComments();
            } else {
            // Otherwise, close 'em why don'tcha?
                closeComments();
            }
        };
        function toggleCommentReplies() {
            // var commentMod = $(this).closest('.comment-mod');
            $('.comment-mod').on('click', '.show-reply', function(){
                if($(this).closest('li.comment-mod').hasClass('comment-reply-active')){
                    $(this).text('View 3 Replies');
                    $(this).closest('li.comment-mod').removeClass('comment-reply-active');
                    $(this).closest('li.comment-mod-with-reply')[0].scrollIntoView();
                    document.body.scrollTop -= 100;
                } else {
                    $(this).text('Hide Replies');
                    $(this).closest('li.comment-mod').addClass('comment-reply-active');
                }
            });
        };

        function openCommentReplyForm() {
            // var commentMod = $(this).closest('.comment-mod');
            $('.comment-mod').on('click', '.js-comment-reply-toggle', function(e){
                e.preventDefault();
                $(this).closest('li.comment-mod').toggleClass('comment-reply-form-active');
            });
        };

        function watchCommentFocus() {
            $('.comment-txt-bd')
            .on('mouseenter', function () {
                $(this).addClass('comment-in-focus');
            }).on('mouseleave', function () {
                $(this).removeClass('comment-in-focus');
            });

            $('.comment-vote').on('click', function(e){
                e.preventDefault();

                var $this = $(this)
                var textUp = $(this).html;
                $this.toggleClass('voted');
                setTimeout(function(){
                    $this.parent().addClass('has-voted');
                }, 3000);
            });
        };

        function selectCommentFilter() {
            var filter = $('.comment-filter');

            filter.on('click', function(e){
                e.preventDefault();
                filter.removeClass('selected');
                $(this).addClass('selected');
            });
        };

        function selectPaginationFilter() {
            var page = $('.pagination');

            page.on('click', function(e){
                e.preventDefault();
                page.removeClass('selected');
                $(this).addClass('selected');
            });
        };

        function bindCommentHandlers() {
            // Just open the comments
            $('body').on('click', '.js-toggle-comments', function(e){
                e.preventDefault();
                toggleComments();
                if($(this).hasClass('hide-comments-btn')) {
                    $('.story-comments')[0].scrollIntoView();
                    if ($(window).width() >= 650){
                        document.body.scrollTop -= 90;
                    } else {
                        document.body.scrollTop -= 41;
                    }
                }
            });


            // Go to the comments and open them
            $('body').on('click', '.js-goto-open-comments', function(e){
                e.preventDefault();
                $.scrollTo($comment_mod, 300);
                if ($page_mod.hasClass('comments-closed')) {
                    openComments();
                }
            });
        };

        function watchTwitterFocus() {
            $('.quick-tweet')
            .on('mouseenter', function () {
                $(this).addClass('tz-in-focus');
            }).on('mouseleave', function () {
                $(this).removeClass('tz-in-focus');
            });
        };

        function userMessageFeedback() {
            $('.js-close-message').on('click', function(e){
                var $this = $(this);
                var parent = $this.parent();
                var height = parent.outerHeight();
                // console.log('height', height + 'px');
                if($this.hasClass('user-message-btn-alert')){
                    $this.addClass('user-message-btn-active');
                    if($this.hasClass('js-trigger-dn-switch')){
                        $('.dn-switch').addClass('active');
                    }
                    alert('Would you like to enable desktop notifications?');
                    parent.addClass('user-message-mod-alert');
                    setTimeout(function(){
                        parent.slideUp(400);
                    },3000);
                } else {
                    parent.addClass('closing');
                    parent.slideUp(400);
                }
            });
        };


        function toggleSwitches() {
            $('.switch-inner').on('click', function(){
                var $this = $(this);
                $this.parent().toggleClass('active');
            });
        }

        function toggleStocks() {
            if($('body').hasClass('money-section-front')){
                $('.mobile-stock-trigger').on('click', function(){
                    var $this = $(this);
                    $('.stocks-mod').toggleClass('mobile-stock-search-default');
                    $('.stocks-mod').toggleClass('mobile-stock-search-active');
                    $('.stock-search-input').focus();
                    if($('.stock-search').hasClass('mobile-stock-search-active')){
                        $('.stock-search-input')[0].placeholder='Symbol Search';
                    } else {
                        $('.stock-search-input')[0].placeholder='Symbol Search   (ex: AIG, AAPL, GE)';
                    }
                });
                $(window).on('resize', function() {
                    if($(window).width() > 425) {
                        console.log('test');
                        $('stock-search').removeClass('mobile-stock-search-active');
                        $('.stock-search-input')[0].placeholder='Symbol Search';
                    } else {
                        $('.stock-search-input')[0].placeholder='Symbol Search   (ex: AIG, AAPL, GE)';
                    }
                })
            }
        }

        function watchBigNews() {
            $('.bn-video-trigger').click(function(e) {
                e.preventDefault();
                var $this = $(this);
                $this.parent().toggleClass('video-active');
            });
            if($('body').hasClass('big-news-w-img')){
                var windowHeight = $(window).height();
                var hgroupHeight = $('.big-news-h-group').height();


                if($(window).height() > 800) {
                    $('.big-news-img-mod').css('min-height', (800*.4 + 1) + 'px');
                    $('.big-news-inner-mod').css('margin-top', (800*.4) + 'px');
                } else {
                    $('.big-news-img-mod').css('min-height', (windowHeight*.4 + 1) + 'px');
                    $('.big-news-inner-mod').css('margin-top', (windowHeight*.4) + 'px');
                }
            }
        }

        function socialOnLoad() {
            setTimeout(function () {
              $('.nav-button-mod').removeClass('nav-button-mod-load');
            }, 3700);
        };

        function watchSocial() {
            var nav_btn = $('.nav-sm-button');

            $('.nav-sm-button').click(function(e) {
                e.preventDefault();

                var $this = $(this);

                if ($('.touch')) {
                    if($this.hasClass('active')){
                        nav_btn.removeClass('active');
                    } else {
                        nav_btn.removeClass('active');
                        $this.addClass('active');
                    }
                }
            });
            $('.page-content').click(function() {
                nav_btn.removeClass('active');
            });
            $(window).scroll(function() {
                nav_btn.removeClass('active');
            });
        }

        $(window).on('resize', function() {
            watchBigNews();
            watchSocial();
        })

        watchSocial();
        watchBigNews();
        toggleStocks();
        bindCommentHandlers();
        socialOnLoad();
        toggleCommentReplies();
        openCommentReplyForm();
        watchCommentFocus();
        selectCommentFilter();
        selectPaginationFilter();
        watchTwitterFocus();
        userMessageFeedback();
        socialOnLoad();
        toggleSwitches();

        // enables expanding form for comments -- nh
        $('body').on('click', '.expandable-form', function(){
            $(this).addClass('expandable-form-active');
        });

        // enable fastclick
        $(function() {
            // FastClick.attach(document.body);
        });

    } // initCommentControls

    // bcom_content.init();

    setTimeout(function() {
        bcom_photos.init();
        bcom_nav.init();

        initQuickVideoToggle();
        initMustReadsToggle();
        initCommentControls();

        // In Quick Tease Filter, 'All Stories' is active by default
        $('.js-quick-filter-all').addClass('filter-active');

        // Tell us when user touches or scrolls the Filter Nav
        // so we can hide the hints that there's more to see
        $('.subnav-mod, .filter-nav-mod').on('touchstart, scroll', function(e){
            $(this).addClass('is-scrolling');
        });

        var body = document.body,
            timer;

            // disable pointer events on scroll
        // window.addEventListener('scroll', function() {
        //   clearTimeout(timer);
        //   if(!body.classList.contains('disable-hover')) {
        //     body.classList.add('disable-hover')
        //   }

        //   timer = setTimeout(function(){
        //     body.classList.remove('disable-hover')
        //   },100);
        // }, false);

    }, 1000);


    if ($('body').hasClass('page-hp')){
        setTimeout(function () {
          $('body').addClass('new-content');
        }, 7000);
    }

    //  press 1 to toggle color-test

    // var keyObj = {
    //     49: function() {
    //         $('body').toggleClass('color-test-3');
    //     }
        // 49: function() {
        //     $('.js-toc-trigger:first').trigger('click');
        // },
        // 50: function() {
        //     $('html, body').animate({ scrollTop: "730px" }, 800);
        // },
        // 51: function() {
        //     $('.fn-link-news:first').trigger('click');
        // },
        // // 52: function() {
        // //     $('.fn-link-sports:first').trigger('click');
        // // },
        // // 53: function() {
        // //     $('.js-quick-filter-all:first').trigger('click');
        // // },
        // 52: function() {
        //     $('.popup-trigger-test:first').trigger('click');
        // },
        // 53: function() {
        //     $('html, body').animate({ scrollTop: "0" }, 800);
        // },
        // 54: function() {
        //     $('html, body').animate({ scrollTop: "745px" }, 800);
        // },
        // 55: function() {
        //     $('html, body').animate({ scrollTop: "1911px" }, 1000);
        // }


    // };

    // $(document).on('keydown', function(e) {
    //     if ($.inArray(e.which + '', Object.keys(keyObj)) >= 0) {
    //         keyObj[e.which]();
    //     }
    // });

    // $(window).on('scroll', function() {
    //     console.log( $(this).scrollTop() );
    // });

});
