"use strict";

var theme = {
  /**
   * Theme's components/functions list
   * Comment out or delete the unnecessary component.
   * Some components have dependencies (plugins).
   * Do not forget to remove dependency from src/js/vendor/ and recompile.
   */
  init: function () {
    // Add form validation
    theme.stickyHeader();
    theme.subMenu();
    theme.offCanvas();
    theme.isotope();
    theme.onepageHeaderOffset();
    theme.sectionHeaderOffset();
    theme.spyScroll();
    theme.anchorSmoothScroll();
    theme.svgInject();
    theme.backgroundImage();
    theme.backgroundImageMobile();
    theme.imageHoverOverlay();
    theme.rellax();
    theme.scrollCue();
    theme.swiperSlider();
    //theme.lightbox();
    theme.plyr();
    theme.progressBar();
    theme.loader();
    theme.pageProgress();
    theme.counterUp();
    theme.bsTooltips();
    theme.bsPopovers();
    theme.bsModal();
    theme.iTooltip();
    //theme.forms();
    theme.passVisibility();
    theme.pricingSwitcher();
    theme.textRotator();
    theme.codeSnippet();
  },

  /**
   * Sticky Header
   * Enables sticky behavior on navbar on page scroll
   * Requires assets/js/vendor/headhesive.min.js
   */
  stickyHeader: () => {
    var navbar = document.querySelector(".navbar");
    if (navbar == null) return;
    var options = {
      offset: 350,
      offsetSide: "top",
      classes: {
        clone: "navbar-clone fixed",
        stick: "navbar-stick",
        unstick: "navbar-unstick",
      },
    };
    var banner = new Headhesive(".navbar", options);
  },
  /**
   * Sub Menus
   * Enables multilevel dropdown
   */
  subMenu: () => {
    (function ($bs) {
      const CLASS_NAME = "has-child-dropdown-show";
      $bs.Dropdown.prototype.toggle = (function (_original) {
        return function () {
          if (this._element && this._element.closest && this._element.closest(".cwgb-search-block")) {
            return _original.call(this);
          }
          document.querySelectorAll("." + CLASS_NAME).forEach(function (e) {
            e.classList.remove(CLASS_NAME);
          });
          let dd = this._element
            .closest(".dropdown")
            .parentNode.closest(".dropdown");
          for (
            ;
            dd && dd !== document;
            dd = dd.parentNode.closest(".dropdown")
          ) {
            dd.classList.add(CLASS_NAME);
          }
          return _original.call(this);
        };
      })($bs.Dropdown.prototype.toggle);
      document.querySelectorAll(".dropdown").forEach(function (dd) {
        dd.addEventListener("hide.bs.dropdown", function (e) {
          if (this.classList.contains(CLASS_NAME)) {
            this.classList.remove(CLASS_NAME);
            e.preventDefault();
          }
          e.stopPropagation();
        });
      });
    })(bootstrap);
  },
  /**
   * Offcanvas
   * Enables offcanvas-nav, closes offcanvas on anchor clicks, focuses on input in search offcanvas
   */
  offCanvas: () => {
    var navbar = document.querySelector(".navbar");
    if (navbar == null) return;
    const navOffCanvasBtn = document.querySelectorAll(".offcanvas-nav-btn");
    const navOffCanvas = document.querySelector(
      ".navbar:not(.navbar-clone) .offcanvas-nav"
    );
    const bsOffCanvas = new bootstrap.Offcanvas(navOffCanvas, { scroll: true });
    const scrollLink = document.querySelectorAll(
      ".onepage .navbar li a.scroll"
    );
    navOffCanvasBtn.forEach((e) => {
      e.addEventListener("click", (event) => {
        bsOffCanvas.show();
      });
    });
    scrollLink.forEach((e) => {
      e.addEventListener("click", (event) => {
        bsOffCanvas.hide();
      });
    });
    document.addEventListener("click", function (e) {
      const trigger = e.target.closest("[data-bs-target]");
      if (!trigger) return;
      const targetId = trigger.getAttribute("data-bs-target");
      if (!targetId) return;
      const panel = document.querySelector(targetId);
      if (!panel) return;
      setTimeout(function () {
        const input = panel.querySelector(
          "form.search-form input, .search-form input"
        );
        if (input) input.focus();
      }, 350);
    });
  },
  /**
   * Isotope
   * Enables isotope grid layout and filtering
   * Requires assets/js/vendor/isotope.pkgd.min.js
   * Requires assets/js/vendor/imagesloaded.pkgd.min.js
   */
  isotope: () => {
    var grids = document.querySelectorAll(".grid");
    if (grids != null) {
      grids.forEach((g) => {
        var grid = g.querySelector(".isotope");
        var filtersElem = g.querySelector(".isotope-filter");
        var buttonGroups = g.querySelectorAll(".isotope-filter");
        grid.style.opacity = "0";
        var iso = new Isotope(grid, {
          itemSelector: ".item",
          layoutMode: "masonry",
          masonry: {
            columnWidth: grid.offsetWidth / 12,
          },
          percentPosition: true,
          transitionDuration: "0.7s",
        });
        imagesLoaded(grid)
          .on("progress", function () {
            iso.layout({
              masonry: {
                columnWidth: grid.offsetWidth / 12,
              },
            });
          })
          .on("always", function () {
            grid.style.transition = "opacity 0.4s";
            grid.style.opacity = "1";
          });
        window.addEventListener(
            "resize",
            function () {
              iso.arrange({
                masonry: {
                  columnWidth: grid.offsetWidth / 12,
                },
              });
            },
            true
          );
        if (filtersElem != null) {
          filtersElem.addEventListener("click", function (event) {
            if (!matchesSelector(event.target, ".filter-item")) {
              return;
            }
            var filterValue = event.target.getAttribute("data-filter");
            iso.arrange({
              filter: filterValue,
            });
          });
          for (var i = 0, len = buttonGroups.length; i < len; i++) {
            var buttonGroup = buttonGroups[i];
            buttonGroup.addEventListener("click", function (event) {
              if (!matchesSelector(event.target, ".filter-item")) {
                return;
              }
              buttonGroup.querySelector(".active").classList.remove("active");
              event.target.classList.add("active");
            });
          }
        }
      });
    }
  },
  /**
   * Onepage Header Offset
   * Adds an offset value to anchor point equal to sticky header height on a onepage
   */
  onepageHeaderOffset: () => {
    var navbar = document.querySelector(".navbar");
    if (navbar == null) return;
    const header_height = document.querySelector(".navbar").offsetHeight;
    const shrinked_header_height = 75;
    const sections = document.querySelectorAll(".onepage section");
    sections.forEach((section) => {
      section.style.paddingTop = shrinked_header_height + "px";
      section.style.marginTop = "-" + shrinked_header_height + "px";
    });
    const first_section = document.querySelector(
      ".onepage section:first-of-type"
    );
    if (first_section != null) {
      first_section.style.paddingTop = header_height + "px";
      first_section.style.marginTop = "-" + header_height + "px";
    }
  },
  /**
   * Section Header Offset
   * Adjusts the first min-vh-* section's padding/margin on pages
   * where the navbar is positioned absolutely or fixed (overlaps content).
   */
  sectionHeaderOffset: () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    const pos = getComputedStyle(navbar).position;
    if (pos !== 'absolute' && pos !== 'fixed') return;
    if (!document.querySelector('.codeweber-top-header')) return;
    const first = document.querySelector(
      '.wp-block-codeweber-blocks-section[class*="min-vh-"]'
    );
    if (!first) return;
    const apply = () => {
      const h = navbar.offsetHeight;
      first.style.paddingTop = h + 'px';
      first.style.marginTop  = '-' + h + 'px';
    };
    apply();
    window.addEventListener('resize', apply);
  },
  /**
   * Spy Scroll
   * Highlights the active nav link while scrolling through sections
   */
  spyScroll: () => {
    let section = document.querySelectorAll("section[id]");
    let navLinks = document.querySelectorAll(".nav-link.scroll");
    window.onscroll = () => {
      section.forEach((sec) => {
        let top = window.scrollY; //returns the number of pixels that the document is currently scrolled vertically.
        let offset = sec.offsetTop - 0; //returns the distance of the outer border of the current element relative to the inner border of the top of the offsetParent, the closest positioned ancestor element
        let height = sec.offsetHeight; //returns the height of an element, including vertical padding and borders, as an integer
        let id = sec.getAttribute("id"); //gets the value of an attribute of an element
        if (top >= offset && top < offset + height) {
          navLinks.forEach((links) => {
            links.classList.remove("active");
            document
              .querySelector(`.nav-link.scroll[href*=${id}]`)
              .classList.add("active");
            //[att*=val] Represents an element with the att attribute whose value contains at least one instance of the substring "val". If "val" is the empty string then the selector does not represent anything.
          });
        }
      });
    };
  },
  /**
   * Anchor Smooth Scroll
   * Adds smooth scroll animation to links with .scroll class
   * Requires assets/js/vendor/smoothscroll.js
   */
  anchorSmoothScroll: () => {
    const links = document.querySelectorAll(".scroll");
    for (const link of links) {
      link.addEventListener("click", clickHandler);
    }
    function clickHandler(e) {
      e.preventDefault();
      this.blur();
      const href = this.getAttribute("href");
      if (!href || !href.startsWith('#')) return;
      
      const targetElement = document.querySelector(href);
      if (!targetElement) return;
      
      // Получаем высоту фиксированного header, если он есть
      let headerOffset = 0;
      const navbar = document.querySelector(".navbar-clone.navbar-stick, .navbar.fixed");
      if (navbar) {
        headerOffset = navbar.offsetHeight || 75;
      } else {
        // Если нет фиксированного header, проверяем обычный navbar
        const regularNavbar = document.querySelector(".navbar");
        if (regularNavbar) {
          headerOffset = regularNavbar.offsetHeight || 0;
        }
      }
      
      // Добавляем небольшой дополнительный offset для лучшего позиционирования
      const additionalOffset = 20;
      const offsetTop = targetElement.offsetTop - headerOffset - additionalOffset;
      
      scroll({
        top: Math.max(0, offsetTop),
        behavior: "smooth",
      });
    }
  },
  /**
   * SVGInject
   * Replaces an img element with an inline SVG so you can apply colors to your SVGs
   * Requires assets/js/vendor/svg-inject.min.js
   */
  svgInject: () => {
    SVGInject.setOptions({
      onFail: function (img, svg) {
        img.classList.remove("svg-inject");
      },
    });
    document.addEventListener("DOMContentLoaded", function () {
      SVGInject(document.querySelectorAll("img.svg-inject"), {
        useCache: true,
      });
    });
  },
  /**
   * Background Image
   * Adds a background image link via data attribute "data-image-src"
   */
  backgroundImage: () => {
    var bg = document.querySelectorAll(".bg-image");
    for (var i = 0; i < bg.length; i++) {
      var url = bg[i].getAttribute("data-image-src");
      bg[i].style.backgroundImage = "url('" + url + "')";
    }
  },
  /**
   * Background Image Mobile
   * Adds .mobile class to background images on mobile devices for styling purposes
   */
  backgroundImageMobile: () => {
    var isMobile =
      navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPad/i) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
      navigator.userAgent.match(/iPod/i) ||
      navigator.userAgent.match(/BlackBerry/i)
        ? true
        : false;
    if (isMobile) {
      document.querySelectorAll(".image-wrapper").forEach((e) => {
        e.classList.add("mobile");
      });
    }
  },
  /**
   * Image Hover Overlay
   * Adds span.bg inside .overlay for simpler markup and styling purposes
   */
  imageHoverOverlay: () => {
    var overlay = document.querySelectorAll(".overlay > a, .overlay > span");
    for (var i = 0; i < overlay.length; i++) {
      var overlay_bg = document.createElement("span");
      overlay_bg.className = "bg";
      overlay[i].appendChild(overlay_bg);
    }
  },
  /**
   * Rellax.js
   * Adds parallax animation to shapes and elements
   * Requires assets/js/vendor/rellax.min.js
   */
  rellax: () => {
    if (document.querySelector(".rellax") != null) {
      window.onload = function () {
        var rellax = new Rellax(".rellax", {
          speed: 2,
          center: true,
          breakpoints: [576, 992, 1201],
        });
        var projects_overflow = document.querySelectorAll(".projects-overflow");
        imagesLoaded(projects_overflow, function () {
          rellax.refresh();
        });
      };
    }
  },
  /**
   * scrollCue.js
   * Enables showing elements by scrolling
   * Requires assets/js/vendor/scrollCue.min.js
   */
    scrollCue: () => {
    scrollCue.init({
      interval: -400,
      duration: 700,
      percentage: 0.8,
    });
    scrollCue.update();
  },
  /**
   * Swiper Slider
   * Enables carousels and sliders
   * Requires assets/js/vendor/swiper-bundle.min.js
   */
  swiperSlider: function () {
    var carousel = document.querySelectorAll(".swiper-container");
    for (let i = 0; i < carousel.length; i++) {
      var slider1 = carousel[i];
      if (slider1.querySelector(".swiper.swiper-initialized")) continue;
      slider1.classList.add("swiper-container-" + i);
      var controls = document.createElement("div");
      controls.className = "swiper-controls";
      var pagi = document.createElement("div");
      pagi.className = "swiper-pagination";
      var navi = document.createElement("div");
      navi.className = "swiper-navigation";
      var prev = document.createElement("div");
      prev.className = "swiper-button swiper-button-prev";
      var next = document.createElement("div");
      next.className = "swiper-button swiper-button-next";
      slider1.appendChild(controls);
      controls.appendChild(navi);
      navi.appendChild(prev);
      navi.appendChild(next);
      controls.appendChild(pagi);
      var sliderEffect = slider1.getAttribute("data-effect")
        ? slider1.getAttribute("data-effect")
        : "slide";
      if (slider1.getAttribute("data-items-auto") === "true") {
        var slidesPerViewInit = "auto";
        var breakpointsInit = null;
      } else {
        var sliderItems = slider1.getAttribute("data-items")
          ? slider1.getAttribute("data-items")
          : 3; // items in all devices
        var sliderItemsXs = slider1.getAttribute("data-items-xs")
          ? slider1.getAttribute("data-items-xs")
          : 1; // start - 575
        var sliderItemsSm = slider1.getAttribute("data-items-sm")
          ? slider1.getAttribute("data-items-sm")
          : Number(sliderItemsXs); // 576 - 767
        var sliderItemsMd = slider1.getAttribute("data-items-md")
          ? slider1.getAttribute("data-items-md")
          : Number(sliderItemsSm); // 768 - 991
        var sliderItemsLg = slider1.getAttribute("data-items-lg")
          ? slider1.getAttribute("data-items-lg")
          : Number(sliderItemsMd); // 992 - 1199
        var sliderItemsXl = slider1.getAttribute("data-items-xl")
          ? slider1.getAttribute("data-items-xl")
          : Number(sliderItemsLg); // 1200 - end
        var sliderItemsXxl = slider1.getAttribute("data-items-xxl")
          ? slider1.getAttribute("data-items-xxl")
          : Number(sliderItemsXl); // 1500 - end
        var slidesPerViewInit = sliderItems;
        var breakpointsInit = {
          0: {
            slidesPerView: Number(sliderItemsXs),
          },
          576: {
            slidesPerView: Number(sliderItemsSm),
          },
          768: {
            slidesPerView: Number(sliderItemsMd),
          },
          992: {
            slidesPerView: Number(sliderItemsLg),
          },
          1200: {
            slidesPerView: Number(sliderItemsXl),
          },
          1400: {
            slidesPerView: Number(sliderItemsXxl),
          },
        };
      }
      var sliderSpeed = slider1.getAttribute("data-speed")
        ? slider1.getAttribute("data-speed")
        : 500;
      var sliderAutoPlay = slider1.getAttribute("data-autoplay") !== "false";
      var sliderAutoPlayTime = slider1.getAttribute("data-autoplaytime")
        ? slider1.getAttribute("data-autoplaytime")
        : 5000;
      var sliderAutoHeight = slider1.getAttribute("data-autoheight") === "true";
      var sliderResizeUpdate =
        slider1.getAttribute("data-resizeupdate") !== "false";
      var sliderAllowTouchMove = slider1.getAttribute("data-drag") !== "false";
      var sliderReverseDirection =
        slider1.getAttribute("data-reverse") === "true";
      var sliderMargin = slider1.getAttribute("data-margin")
        ? slider1.getAttribute("data-margin")
        : 30;
      var sliderLoop = slider1.getAttribute("data-loop") === "true";
      var sliderCentered = slider1.getAttribute("data-centered") === "true";
      let swiper = slider1.querySelector(".swiper:not(.swiper-thumbs)");
      let swiperTh = slider1.querySelector(".swiper-thumbs");
      let thumbsDirection = slider1.getAttribute("data-thumbs-direction") || "horizontal";
      let thumbsItems = slider1.getAttribute("data-thumbs-items")
        ? Number(slider1.getAttribute("data-thumbs-items"))
        : 5;
      let thumbsMousewheel = slider1.getAttribute("data-thumbs-mousewheel") === "true";
      let sliderTh = new Swiper(swiperTh, {
        slidesPerView: thumbsItems,
        spaceBetween: 10,
        loop: false,
        threshold: 2,
        slideToClickedSlide: true,
        direction: thumbsDirection,
        mousewheel: thumbsMousewheel ? { forceToAxis: thumbsDirection === 'vertical' } : false,
        freeMode: thumbsMousewheel,
      });
      if (slider1.getAttribute("data-thumbs") === "true") {
        var thumbsInit = sliderTh;
        if (thumbsDirection === "vertical") {
          slider1.classList.add("swiper-thumbs-v");
        }
        var swiperMain = document.createElement("div");
        swiperMain.className = "swiper-main";
        swiper.parentNode.insertBefore(swiperMain, swiper);
        swiperMain.appendChild(swiper);
        slider1.removeChild(controls);
        swiperMain.appendChild(controls);
      } else {
        var thumbsInit = null;
      }
      let slider = new Swiper(swiper, {
        on: {
          beforeInit: function () {
            if (
              slider1.getAttribute("data-nav") !== "true" &&
              slider1.getAttribute("data-dots") !== "true"
            ) {
              controls.remove();
            }
            if (slider1.getAttribute("data-dots") !== "true") {
              pagi.remove();
            }
            if (slider1.getAttribute("data-nav") !== "true") {
              navi.remove();
            }
          },
          init: function () {
            if (slider1.getAttribute("data-autoplay") !== "true") {
              this.autoplay.stop();
            }
            this.update();
          },
        },
        autoplay: {
          delay: sliderAutoPlayTime,
          disableOnInteraction: false,
          reverseDirection: sliderReverseDirection,
          pauseOnMouseEnter: false,
        },
        allowTouchMove: sliderAllowTouchMove,
        speed: parseInt(sliderSpeed),
        slidesPerView: slidesPerViewInit,
        loop: sliderLoop,
        centeredSlides: sliderCentered,
        spaceBetween: Number(sliderMargin),
        effect: sliderEffect,
        autoHeight: sliderAutoHeight,
        grabCursor: true,
        resizeObserver: false,
        updateOnWindowResize: sliderResizeUpdate,
        breakpoints: breakpointsInit,
        pagination: {
          el: carousel[i].querySelector(".swiper-pagination"),
          clickable: true,
        },
        navigation: {
          prevEl: slider1.querySelector(".swiper-button-prev"),
          nextEl: slider1.querySelector(".swiper-button-next"),
        },
        thumbs: {
          swiper: thumbsInit,
        },
      });
      if (thumbsInit !== null) {
        // Sync vertical thumbs height with main image height
        if (thumbsDirection === "vertical") {
          var syncThumbsHeight = function() {
            var mainImg = swiper.querySelector(".swiper-slide img");
            if (mainImg && swiperTh) {
              var calcAndApply = function() {
                var spaceBetween = 10; // Swiper spaceBetween for thumbs
                var flexGap = 10; // CSS gap between thumbs and main
                var containerW = slider1.clientWidth;
                // Solve: containerW = mainSide + flexGap + thumbW
                //        thumbW = thumbH = (mainSide - (items-1)*spaceBetween) / items
                // => mainSide = (containerW - flexGap + (items-1)*spaceBetween/items) * items / (items+1)
                var mainSide = (containerW - flexGap + (thumbsItems - 1) * spaceBetween / thumbsItems) * thumbsItems / (thumbsItems + 1);
                mainSide = Math.floor(mainSide);
                var thumbH = Math.floor((mainSide - spaceBetween * (thumbsItems - 1)) / thumbsItems);
                var thumbW = thumbH;
                // Recalculate mainSide from actual thumbH to avoid rounding mismatch
                mainSide = thumbH * thumbsItems + spaceBetween * (thumbsItems - 1);

                // Apply main square
                var swiperMainEl = swiper.parentElement;
                if (swiperMainEl && swiperMainEl.classList.contains("swiper-main")) {
                  swiperMainEl.style.width = mainSide + "px";
                  swiperMainEl.style.flex = "none";
                }
                swiper.style.height = mainSide + "px";
                swiper.style.overflow = "hidden";
                var mainSlides = swiper.querySelectorAll(".swiper-slide");
                for (var m = 0; m < mainSlides.length; m++) {
                  mainSlides[m].style.height = mainSide + "px";
                  var fig = mainSlides[m].querySelector("figure");
                  if (fig) { fig.style.height = "100%"; fig.style.margin = "0"; }
                  var img = mainSlides[m].querySelector("img");
                  if (img) { img.style.height = "100%"; img.style.width = "100%"; img.style.objectFit = "cover"; }
                }

                // Apply thumbs
                swiperTh.style.height = mainSide + "px";
                swiperTh.style.width = thumbW + "px";
                var thumbSlides = swiperTh.querySelectorAll(".swiper-slide");
                for (var t = 0; t < thumbSlides.length; t++) {
                  thumbSlides[t].style.height = thumbH + "px";
                }
                sliderTh.update();
                slider.update();
              };
              if (mainImg.complete) {
                calcAndApply();
              } else {
                mainImg.addEventListener("load", calcAndApply);
              }
            }
          };
          syncThumbsHeight();
          var resizeTimer;
          window.addEventListener("resize", function() {
            if (swiperTh) {
              clearTimeout(resizeTimer);
              resizeTimer = setTimeout(calcAndApply, 100);
            }
          });
        }
        // Gallery skeleton: скрыть скелетон и показать swiper после загрузки первого изображения
        var firstSlideImg = swiper.querySelector(".swiper-slide img");
        var markGalleryReady = function () {
          slider1.classList.add("cw-gallery-ready");
        };
        if (!firstSlideImg || firstSlideImg.complete) {
          markGalleryReady();
        } else {
          firstSlideImg.addEventListener("load",  markGalleryReady, { once: true });
          firstSlideImg.addEventListener("error", markGalleryReady, { once: true });
        }

        if (document.querySelector("input.variation_id") !== null) {
          document.querySelector("input.variation_id").onchange = function () {
            document.querySelector(
              ".swiper-thumbs .swiper-wrapper .swiper-slide img"
            ).src = document.querySelector(
              ".woocommerce-product-gallery__wrapper .swiper-slide img"
            ).src;
            slider.slideTo(slider.activeIndex + 1, 1, true);
            slider.slideTo(0, 500, true);
            theme.lightbox.reload();
          };
        }
      }
    }
  },
  /**
   * GLightbox
   * Enables lightbox functionality
   * Requires assets/js/vendor/glightbox.js
   */
  lightbox: typeof GLightbox !== 'undefined' ? GLightbox({
    selector: "*[data-glightbox]",
    touchNavigation: true,
    loop: false,
    zoomable: true,
    autoplayVideos: false,
    moreLength: 0,
    slideExtraAttributes: {
      poster: "",
    },
    plyr: {
      css: "",
      js: "",
      config: {
        ratio: "",
        fullscreen: {
          enabled: false,
          iosNative: false,
        },
        youtube: {
          noCookie: true,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
        },
        vimeo: {
          byline: false,
          portrait: false,
          title: false,
          transparent: false,
        },
        vkvideo: {
          allowfullscreen: true,
          allow:
            "autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;",
          style: "border: none; width: 720px; height: 405px;",
          width: "720",
          height: "405",
        },
        rutube: {
          allowfullscreen: true,
          allow: "clipboard-write; autoplay;",
          style: "border: none; width: 720px; height: 405px;",
          width: "720",
          height: "405",
        },
      },
    },
  }) : null,

  /**
   * Plyr
   * Enables media player
   * Requires assets/js/vendor/plyr.js
   */
  plyr: () => {
    var players = Plyr.setup(".player", {
      loadSprite: true,
    });
  },
  /**
   * Progressbar
   * Enables animated progressbars
   * Requires assets/js/vendor/progressbar.min.js
   * Requires assets/js/vendor/noframework.waypoints.min.js
   */
  progressBar: () => {
    const pline = document.querySelectorAll(".progressbar.line");
    const pcircle = document.querySelectorAll(".progressbar.semi-circle");
    pline.forEach((e) => {
      var line = new ProgressBar.Line(e, {
        strokeWidth: 6,
        trailWidth: 6,
        duration: 3000,
        easing: "easeInOut",
        text: {
          style: {
            color: "inherit",
            position: "absolute",
            right: "0",
            top: "-30px",
            padding: 0,
            margin: 0,
            transform: null,
          },
          autoStyleContainer: false,
        },
        step: (state, line) => {
          line.setText(Math.round(line.value() * 100) + " %");
        },
      });
      var value = e.getAttribute("data-value") / 100;
      new Waypoint({
        element: e,
        handler: function () {
          line.animate(value);
        },
        offset: "bottom-in-view",
      });
    });
    pcircle.forEach((e) => {
      var circle = new ProgressBar.SemiCircle(e, {
        strokeWidth: 6,
        trailWidth: 6,
        duration: 2000,
        easing: "easeInOut",
        step: (state, circle) => {
          circle.setText(Math.round(circle.value() * 100));
        },
      });
      var value = e.getAttribute("data-value") / 100;
      new Waypoint({
        element: e,
        handler: function () {
          circle.animate(value);
        },
        offset: "bottom-in-view",
      });
    });
  },
  /**
   * Loader
   *
   */
  loader: () => {
    var preloader = document.querySelector(".page-loader");
    if (preloader != null) {
      document.body.onload = function () {
        setTimeout(function () {
          if (!preloader.classList.contains("done")) {
            preloader.classList.add("done");
          }
        }, 1000);
      };
    }
  },
  /**
   * Page Progress
   * Shows page progress on the bottom right corner of pages
   */
  pageProgress: () => {
    var progressWrap = document.querySelector(".progress-wrap");
    if (progressWrap != null) {
      var progressPath = document.querySelector(".progress-wrap path");
      var pathLength = progressPath.getTotalLength();
      var offset = 50;
      progressPath.style.transition = progressPath.style.WebkitTransition =
        "none";
      progressPath.style.strokeDasharray = pathLength + " " + pathLength;
      progressPath.style.strokeDashoffset = pathLength;
      progressPath.getBoundingClientRect();
      progressPath.style.transition = progressPath.style.WebkitTransition =
        "stroke-dashoffset 10ms linear";
      window.addEventListener("scroll", function (event) {
        var scroll =
          document.body.scrollTop || document.documentElement.scrollTop;
        var height =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;
        var progress = pathLength - (scroll * pathLength) / height;
        progressPath.style.strokeDashoffset = progress;
        var scrollElementPos =
          document.body.scrollTop || document.documentElement.scrollTop;
        if (scrollElementPos >= offset) {
          progressWrap.classList.add("active-progress");
        } else {
          progressWrap.classList.remove("active-progress");
        }
      });
      progressWrap.addEventListener("click", function (e) {
        e.preventDefault();
        window.scroll({
          top: 0,
          left: 0,
          behavior: "smooth",
        });
      });
    }
  },
  /**
   * Counter Up
   * Counts up to a targeted number when the number becomes visible
   * Requires assets/js/vendor/counterup.min.js
   * Requires assets/js/vendor/noframework.waypoints.min.js
   */
  counterUp: () => {
    var counterUp = window.counterUp["default"];
    const counters = document.querySelectorAll(".counter");
    counters.forEach((el) => {
      new Waypoint({
        element: el,
        handler: function () {
          counterUp(el, {
            duration: 1000,
            delay: 50,
          });
          this.destroy();
        },
        offset: "bottom-in-view",
      });
    });
  },
  /**
   * Bootstrap Tooltips
   * Enables Bootstrap tooltips
   * Requires Poppers library
   */
  bsTooltips: () => {
    var tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl, {
        trigger: "hover",
      });
    });
    var tooltipTriggerWhite = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="white-tooltip"]')
    );
    var tooltipWhite = tooltipTriggerWhite.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl, {
        customClass: "white-tooltip",
        trigger: "hover",
        placement: "left",
      });
    });
  },
  /**
   * Bootstrap Popovers
   * Enables Bootstrap popovers
   * Requires Poppers library
   */
  bsPopovers: () => {
    var popoverTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="popover"]')
    );
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
      // Проверяем и исправляем title если он null
      var title = popoverTriggerEl.getAttribute('data-bs-title') || popoverTriggerEl.getAttribute('title');
      if (title === null || title === 'null' || title === '') {
        popoverTriggerEl.setAttribute('data-bs-title', '');
      }
      return new bootstrap.Popover(popoverTriggerEl);
    });
  },
  /**
   * Bootstrap Modal
   * Enables Bootstrap modal popup
   */
  bsModal: () => {
    // Ищем модальные окна с классом modal-popup, но исключаем notification-modal
    // Notification modal обрабатывается отдельно в notification-triggers.js
    var modalPopupElements = document.querySelectorAll(".modal-popup:not(#notification-modal)");
    
    if (modalPopupElements.length > 0) {
      // Обрабатываем все модальные окна с modal-popup (кроме notification-modal)
      // Например, cookie modal и другие
      modalPopupElements.forEach(function(modalPopupElement) {
        // Проверяем, не является ли это notification modal
        if (modalPopupElement.id === 'notification-modal') {
          return; // Пропускаем notification modal
        }
        
        var myModalPopup = new bootstrap.Modal(modalPopupElement);
        
        // Получаем значение задержки из data-wait, или используем 200 по умолчанию
        var waitTime = modalPopupElement.getAttribute('data-wait');
        waitTime = waitTime ? parseInt(waitTime, 10) : 200;
        
        setTimeout(function () {
          // Cookie modal has highest priority - close notification modal before showing
          const notificationModal = document.getElementById('notification-modal');
          if (notificationModal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const notificationBsModal = bootstrap.Modal.getInstance(notificationModal);
            if (notificationBsModal && notificationModal.classList.contains('show')) {
              notificationBsModal.hide();
            }
          }
          
          myModalPopup.show();
        }, waitTime);
      });
      
      // Добавляем глобальный слушатель для блокировки открытия других модальных окон, когда cookie modal открыт
      const cookieModal = document.getElementById('cookieModal');
      if (cookieModal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        // Сохраняем оригинальный метод show один раз при инициализации
        if (!bootstrap.Modal.prototype.show._original) {
          bootstrap.Modal.prototype.show._original = bootstrap.Modal.prototype.show;
        }
        
        // Закрываем все другие модальные окна при открытии cookie modal
        cookieModal.addEventListener('show.bs.modal', function(e) {
          // Блокируем открытие всех других модальных окон
          document.querySelectorAll('.modal:not(#cookieModal)').forEach(function(otherModal) {
            const otherBsModal = bootstrap.Modal.getInstance(otherModal);
            if (otherBsModal && otherModal.classList.contains('show')) {
              otherBsModal.hide();
            }
          });
        });
        
        // Глобальный перехватчик для блокировки открытия других модальных окон
        cookieModal.addEventListener('shown.bs.modal', function(e) {
          // Сохраняем ссылку на оригинальную функцию
          const originalShow = bootstrap.Modal.prototype.show._original || bootstrap.Modal.prototype.show;
          
          // Переопределяем метод show для блокировки открытия других модальных окон
          bootstrap.Modal.prototype.show = function() {
            // Если cookie modal открыт, блокируем открытие других модальных окон
            if (cookieModal.classList.contains('show') && this._element && this._element.id !== 'cookieModal') {

              return;
            }
            // Вызываем оригинальную функцию
            if (originalShow) {
              return originalShow.call(this);
            }
          };
        });
        
        cookieModal.addEventListener('hidden.bs.modal', function(e) {
          // Восстанавливаем оригинальный метод show после закрытия cookie modal
          if (bootstrap.Modal.prototype.show._original) {
            bootstrap.Modal.prototype.show = bootstrap.Modal.prototype.show._original;
          }
        });
      }
    }
    // Fixes jumping of page progress caused by modal
    var innerWidth = window.innerWidth;
    var clientWidth = document.body.clientWidth;
    var scrollSize = innerWidth - clientWidth;
    var myModalEl = document.querySelectorAll(".modal");
    var navbarFixed = document.querySelector(".navbar.fixed");
    var pageProgress = document.querySelector(".progress-wrap");
    function setPadding() {
      if (navbarFixed != null) {
        navbarFixed.style.paddingRight = scrollSize + "px";
      }
      if (pageProgress != null) {
        pageProgress.style.marginRight = scrollSize + "px";
      }
    }
    function removePadding() {
      if (navbarFixed != null) {
        navbarFixed.style.paddingRight = "";
      }
      if (pageProgress != null) {
        pageProgress.style.marginRight = "";
      }
    }
    myModalEl.forEach((myModalEl) => {
      myModalEl.addEventListener("show.bs.modal", function (e) {
        setPadding();
      });
      myModalEl.addEventListener("hidden.bs.modal", function (e) {
        removePadding();
      });
    });
  },
  /**
   * iTooltip
   * Enables custom tooltip style for image hover docs/elements/hover.html
   * Requires assets/js/vendor/itooltip.min.js
   */
  iTooltip: () => {
    var tooltip = new iTooltip(".itooltip");
    tooltip.init({
      className: "itooltip-inner",
      indentX: 15,
      indentY: 15,
      positionX: "right",
      positionY: "bottom",
    });
  },
  /**
   * Form Validation and Contact Form submit
   * Bootstrap validation - Only sends messages if form has class ".contact-form" and is validated and shows success/fail messages
   */
  forms: () => {
    (function () {
      "use strict";
      window.addEventListener(
        "load",
        function () {
          var forms = document.querySelectorAll(".needs-validation");
          var inputRecaptcha = document.querySelector("input[data-recaptcha]");
          window.verifyRecaptchaCallback = function (response) {
            inputRecaptcha.value = response;
            inputRecaptcha.dispatchEvent(new Event("change"));
          };
          window.expiredRecaptchaCallback = function () {
            var inputRecaptcha = document.querySelector(
              "input[data-recaptcha]"
            );
            inputRecaptcha.value = "";
            inputRecaptcha.dispatchEvent(new Event("change"));
          };
          var validation = Array.prototype.filter.call(forms, function (form) {
            form.addEventListener(
              "submit",
              function (event) {
                if (form.checkValidity() === false) {
                  event.preventDefault();
                  event.stopPropagation();
                }
                form.classList.add("was-validated");
                if (form.checkValidity() === true) {
                  event.preventDefault();
                  form.classList.remove("was-validated");
                  // Send message only if the form has class .contact-form
                  var isContactForm = form.classList.contains("contact-form");
                  if (isContactForm) {
                    var data = new FormData(form);
                    var alertClass = "alert-danger";
                    fetch("assets/php/contact.php", {
                      method: "post",
                      body: data,
                    })
                      .then((data) => {
                        if (data.ok) {
                          alertClass = "alert-success";
                        }
                        return data.text();
                      })
                      .then((txt) => {
                        var alertBox =
                          '<div class="alert ' +
                          alertClass +
                          ' alert-dismissible fade show"><button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
                          txt +
                          "</div>";
                        if (alertClass && txt) {
                          form
                            .querySelector(".messages")
                            .insertAdjacentHTML("beforeend", alertBox);
                          form.reset();
                          grecaptcha.reset();
                        }
                      })
                      .catch((err) => {
                        console.error(err);
                      });
                  }
                }
              },
              false
            );
          });
        },
        false
      );
    })();
  },
  /**
   * Password Visibility Toggle
   * Toggles password visibility in password input
   */
  passVisibility: () => {
    let pass = document.querySelectorAll(".password-field");
    for (let i = 0; i < pass.length; i++) {
      let passInput = pass[i].querySelector(".form-control");
      let passToggle = pass[i].querySelector(".password-toggle > i");
      passToggle.addEventListener(
        "click",
        (e) => {
          if (passInput.type === "password") {
            passInput.type = "text";
            passToggle.classList.remove("uil-eye");
            passToggle.classList.add("uil-eye-slash");
          } else {
            passInput.type = "password";
            passToggle.classList.remove("uil-eye-slash");
            passToggle.classList.add("uil-eye");
          }
        },
        false
      );
    }
  },
  /**
   * Pricing Switcher
   * Enables monthly/yearly switcher seen on pricing tables
   */
  pricingSwitcher: () => {
    if (document.querySelector(".pricing-switchers") != null) {
      const wrapper = document.querySelectorAll(".pricing-wrapper");
      wrapper.forEach((wrap) => {
        const switchers = wrap.querySelector(".pricing-switchers");
        const switcher = wrap.querySelectorAll(".pricing-switcher");
        const price = wrap.querySelectorAll(".price");
        switchers.addEventListener("click", (e) => {
          switcher.forEach((s) => {
            s.classList.toggle("pricing-switcher-active");
          });
          price.forEach((p) => {
            p.classList.remove("price-hidden");
            p.classList.toggle("price-show");
            p.classList.toggle("price-hide");
          });
        });
      });
    }
  },
  /**
   * ReplaceMe.js
   * Enables text rotator
   * Requires assets/js/vendor/replaceme.min.js
   */
  textRotator: () => {
    // Обрабатываем элементы с классом rotator-zoom
    document.querySelectorAll(".rotator-zoom").forEach((element) => {
      new ReplaceMe(element, {
        animation: "animate__animated animate__zoomIn",
        speed: 2500,
        separator: ",",
        clickChange: false,
        loopCount: "infinite",
      });
    });

    // Обрабатываем элементы с классом rotator-fade
    document.querySelectorAll(".rotator-fade").forEach((element) => {
      new ReplaceMe(element, {
        animation: "animate__animated animate__fadeInDown",
        speed: 2500,
        separator: ",",
        clickChange: false,
        loopCount: "infinite",
      });
    });
  },
  /**
   * Clipboard.js
   * Enables clipboard on docs
   * Requires assets/js/vendor/clipboard.min.js
   */
  codeSnippet: () => {
    var btnHtml =
      '<button type="button" class="btn btn-sm btn-white rounded-pill btn-clipboard">Copy</button>';
    document
      .querySelectorAll(".code-wrapper-inner")
      .forEach(function (element) {
        element.insertAdjacentHTML("beforebegin", btnHtml);
      });
    var clipboard = new ClipboardJS(".btn-clipboard", {
      target: function (trigger) {
        return trigger.nextElementSibling;
      },
    });
    clipboard.on("success", (event) => {
      event.trigger.textContent = "Copied!";
      event.clearSelection();
      setTimeout(function () {
        event.trigger.textContent = "Copy";
      }, 2000);
    });
    var copyIconCode = new ClipboardJS(".btn-copy-icon");
    copyIconCode.on("success", function (event) {
      event.clearSelection();
      event.trigger.textContent = "Copied!";
      window.setTimeout(function () {
        event.trigger.textContent = "Copy";
      }, 2300);
    });
  },
};

theme.init();

// Custom.js

// Phone mask library (inlined to ensure availability even if plugins.js misses it)
if (typeof PhoneMask === "undefined") {
  class PhoneMaskOptions {
    trimMask = false;
    trimUnmask = true;
    blurMask = true;
    mask = "+7 (___) ___-__-__";
    softCaret = "_";
    caret = "_";
  }

  /**
   * @extends {PhoneMaskOptions}
   */
  class _PhoneMaskMagicOptions {
    /**
     * @type {PhoneMaskOptions}
     * @private
     */
    static _baseOptions = new PhoneMaskOptions();

    /**
     * @return {number}
     */
    get maskMinLength() {
      return this.mask.indexOf(this.softCaret);
    }

    /**
     * @return {number}
     */
    get unmaskMaxLength() {
      return this.mask.match(new RegExp(this.softCaret, "g")).length;
    }

    /**
     * @return {array}
     */
    get maskPosMap() {
      return Array.from(this.mask.matchAll(new RegExp(this.softCaret, "g"))).map(
        ({ index }) => index
      );
    }

    /**
     * @param {PhoneMaskOptions|{}} options
     */
    constructor(options = {}) {
      this._options = _PhoneMaskMagicOptions._initOptions(options);

      this._initOptionAccess();
    }

    /**
     * @private
     */
    _initOptionAccess() {
      _PhoneMaskMagicOptions._fillingOptions.forEach((optionName) => {
        Object.defineProperty(this, optionName, {
          get: () => this._options[optionName],
        });
      });
    }

    /**
     * @param {PhoneMaskOptions|{}} options
     */
    static override(options) {
      Object.assign(
        _PhoneMaskMagicOptions._baseOptions,
        _PhoneMaskMagicOptions._initOptions(options)
      );
    }

    static flush() {
      _PhoneMaskMagicOptions.override(new PhoneMaskOptions());
    }

    /**
     * @return {array}
     * @private
     */
    static get _fillingOptions() {
      return Object.keys(_PhoneMaskMagicOptions._baseOptions);
    }

    /**
     * @param {object} options
     * @return {object} merged options
     * @private
     */
    static _initOptions(options) {
      return _PhoneMaskMagicOptions._fillOptions(options);
    }

    /**
     * @param {object} options
     * @return {object} merged options
     * @private
     */
    static _fillOptions(options) {
      const interestOptionsEntries = Object.entries(options).filter(([key]) =>
          _PhoneMaskMagicOptions._fillingOptions.includes(key)
        ),
        interestOptions = Object.fromEntries(interestOptionsEntries);

      const newOptions = Object.assign(
        {},
        _PhoneMaskMagicOptions._baseOptions,
        interestOptions
      );

      _PhoneMaskMagicOptions._validate(newOptions);

      return newOptions;
    }

    /**
     * @param {object} options
     * @throws {Error}
     * @private
     */
    static _validate(options) {
      // Validate soft caret
      this._checkNumberCaret(options.softCaret);
      this._checkOneCharCaret(options.softCaret);
      this._checkRegexCaret(options.softCaret);

      // Validate user caret
      this._checkNumberCaret(options.caret);

      // Validate phone mask
      if (new RegExp(`${options.softCaret}.*\\d`).test(options.mask)) {
        throw new Error("Mask not support numbers after carets");
      }
      if (!new RegExp(`${options.softCaret}`).test(options.mask)) {
        throw new Error("Soft caret not found in mask");
      }
    }

    /**
     * @param {string} caret
     * @private
     */
    static _checkNumberCaret(caret) {
      if (/\d/.test(caret)) {
        throw new Error("Caret not support number format");
      }
    }

    /**
     * @param {string} caret
     * @private
     */
    static _checkOneCharCaret(caret) {
      if (caret.length !== 1) {
        throw new Error("Caret support only one symbol");
      }
    }

    /**
     * @param {string} caret
     * @private
     */
    static _checkRegexCaret(caret) {
      try {
        new RegExp(`${caret}`).test(caret);
      } catch (e) {
        throw new Error(`Not supported caret "${caret}" in regex, please change`);
      }
    }
  }

  class PhoneMask {
    /**
     * @extends {_PhoneMaskMagicOptions}
     */
    static Options = _PhoneMaskMagicOptions;

    /**
     * @type {PhoneMask.Options}
     */
    options;
    /**
     * @type {HTMLInputElement|Element}
     * @private
     */
    _el;

    /**
     * @return {HTMLInputElement|Element}
     */
    get input() {
      return this._el;
    }

    /**
     * @param {HTMLInputElement|string} selector
     * @param {PhoneMaskOptions|{}} options
     */
    constructor(selector, options = {}) {
      this._init(selector);

      this.options = new PhoneMask.Options(options);

      this.update();
    }

    /**
     * @private
     */
    _init(selector) {
      this._el =
        selector instanceof HTMLInputElement
          ? selector
          : document.querySelector(selector);

      this._el.type = "tel";

      this._bind();
    }

    destroy() {
      this._unbind();

      this._el = undefined;
    }

    /**
     * Updating mask and blur status
     */
    update() {
      this.updateMask();
      this.updateBlur();
    }

    /**
     * Updating mask
     */
    updateMask() {
      this.unmask = this._trimUnmask(this.unmask);
    }

    /**
     * Updating blur
     */
    updateBlur() {
      if (this.isBlur()) {
        if (this.options.blurMask && !this.unmask) {
          this._el.value = "";
        }
      } else {
        this.unmask = this._trimUnmask(this.unmask);
      }
    }

    /**
     * @return {boolean}
     */
    isFocus() {
      return document.activeElement === this._el;
    }

    /**
     * @return {boolean}
     */
    isBlur() {
      return !this.isFocus();
    }

    /**
     * @private
     */
    _bind() {
      this._el.addEventListener("focus", this._onFocus);
      this._el.addEventListener("blur", this._onBlur);
      this._el.addEventListener("input", this._onInput);
      this._el.addEventListener("mouseup", this._onMouseUp);
      this._el.addEventListener("touchend", this._onMouseUp);
    }

    /**
     * @private
     */
    _unbind() {
      this._el.removeEventListener("focus", this._onFocus);
      this._el.removeEventListener("blur", this._onBlur);
      this._el.removeEventListener("input", this._onInput);
      this._el.removeEventListener("mouseup", this._onMouseUp);
      this._el.removeEventListener("touchend", this._onMouseUp);
    }

    /**
     * @private
     */
    _onFocus = () => {
      this.updateBlur();
      this._correctPos();
    };

    /**
     * @private
     */
    _onBlur = () => this.updateBlur();

    /**
     * @private
     */
    _onInput = () => {
      const selectionNumberEnd = this._unmaskPos;

      this.updateMask();

      this._unmaskPos = selectionNumberEnd;
    };

    /**
     * @private
     */
    _onMouseUp = () => {
      this._correctPos();
    };

    /**
     * @private
     */
    _correctPos() {
      const { selectionStart, selectionEnd } = this._el;

      if (selectionStart !== selectionEnd) {
        return;
      }

      const allowRightPos =
          Array.from(this._el.value.matchAll(/\d/g)).at(-1)?.index + 1 || 0,
        allowLeftPos = Math.max(
          this.options.mask.indexOf(this.options.softCaret) || 0,
          0
        ),
        newPos = Math.max(Math.min(selectionStart, allowRightPos), allowLeftPos);

      if (selectionStart !== newPos) {
        this._el.selectionStart = this._el.selectionEnd = newPos;
      }
    }

    /**
     * @param {string} unmask
     * @return {string}
     * @private
     */
    _trimUnmask(unmask) {
      if (unmask.length <= this.options.unmaskMaxLength) {
        return unmask;
      }

      let newUnmask = unmask;

      if (this.options.trimUnmask) {
        newUnmask = unmask.replace(/^[87]/, "");
      }

      return newUnmask.slice(0, this.options.unmaskMaxLength);
    }

    /**
     * @return {string} value without mask
     * @private
     */
    _cleanMask(maskValue) {
      const value = maskValue,
        clearPatternSearch =
          "^" +
          this.options.mask
            .replace(new RegExp(`([^${this.options.softCaret}\\d])`, "g"), "")
            .replace(/(\d)/g, "$1?")
            .replace(new RegExp(`${this.options.softCaret}+`, "g"), "(\\d*?)") +
          "$",
        clearPattern = new RegExp(clearPatternSearch),
        matches = clearPattern.exec(value.replace(/\D/g, ""));

      return (
        matches &&
        matches
          .slice(1)
          .map((val) => val.replace(/\D/g, ""))
          .join("")
      );
    }

    /**
     * @param {string} unmask value without mask
     * @private
     */
    _applyMask(unmask) {
      const patternSearch = unmask.replace(/\d/g, "(\\d)"),
        pattern = new RegExp(patternSearch),
        count = Math.min(unmask.length, this.options.unmaskMaxLength);

      let replaceValue = this.options.mask;

      for (let i = 1; i <= count; i++) {
        replaceValue = replaceValue.replace(
          new RegExp(this.options.softCaret),
          "$" + i
        );
      }

      let maskedValue = unmask.replace(pattern, replaceValue);

      if (this.options.trimMask) {
        const minMaskLen = this.options.maskMinLength,
          lastNumber =
            Array.from(maskedValue.matchAll(/\d/g)).reverse()[0].index + 1;
        maskedValue = maskedValue.slice(0, Math.max(minMaskLen, lastNumber));
      } else if (this.options.softCaret !== this.options.caret) {
        maskedValue = maskedValue.replace(
          new RegExp(this.options.softCaret, "g"),
          this.options.caret
        );
      }

      return maskedValue;
    }

    /**
     * @return {number}
     * @private
     */
    get _unmaskPos() {
      const maskValueToCaret = this._el.value.slice(0, this._el.selectionEnd),
        unmaskValueToCaret = this._cleanMask(maskValueToCaret);

      return unmaskValueToCaret.length;
    }

    /**
     * @param {number} unmaskPos
     * @private
     */
    set _unmaskPos(unmaskPos) {
      const { maskPosMap } = this.options,
        maskMaxAllowedPos = this.unmask.length,
        unmaskPosInMap = Math.min(
          Math.max(0, Math.min(unmaskPos, maskMaxAllowedPos) - 1)
        ),
        unmaskPosMapCorrect = Math.max(0, Math.min(1, unmaskPos)),
        maskPosition = maskPosMap[unmaskPosInMap] + unmaskPosMapCorrect;

      this._el.selectionStart = this._el.selectionEnd = maskPosition;
    }

    /**
     * @return {string} value without mask
     */
    get unmask() {
      return this._cleanMask(this._el.value);
    }

    /**
     * @param {string} unmask value without mask
     */
    set unmask(unmask) {
      this._el.value = this._applyMask(unmask);
    }
  }

  // For webpack
  if (typeof module === "object" && module.exports) {
    module.exports = PhoneMask;
  }
}

var custom = {
  /**
   * Theme's custom components/functions list
   * Comment out or delete the unnecessary component.
   * Some components have dependencies (plugins).
   * Do not forget to remove dependency from src/js/vendor/ and recompile.
   */
  init: function () {
    custom.rippleEffect();
    custom.addTelMask();
    custom.qtyInput();
  },


  addTelMask: function () {
    // Для полей с data-mask-use-theme="true" подставляем маску из настроек темы
    const themeMask = (window.codeweberTheme && window.codeweberTheme.phoneMask) || '';
    if (themeMask) {
      document.querySelectorAll('input[data-mask-use-theme="true"]').forEach((input) => {
        if (!input.dataset.phoneMaskInitialized) {
          input.dataset.mask = themeMask;
        }
      });
    }

    const telInputs = document.querySelectorAll("input[data-mask]");

    telInputs.forEach((input) => {
      // Пропускаем уже инициализированные поля
      if (input.dataset.phoneMaskInitialized === 'true') {
        return;
      }
      
      const mask = input.dataset.mask;
      if (!mask) {
        return;
      }

      const caret = input.dataset.maskCaret;
      const softCaret = input.dataset.maskSoftCaret;

      if (caret && /\d/.test(caret)) {
        console.warn("PhoneMask: caret cannot be a digit", caret);
        return;
      }

      const options = { mask };
      
      // По умолчанию blurMask = false (поле не очищается при потере фокуса)
      // Можно явно включить через data-mask-blur="true"
      const maskBlur = input.dataset.maskBlur;
      if (maskBlur === 'true') {
        options.blurMask = true;
      } else {
        options.blurMask = false;
      }
      
      if (softCaret) {
        options.softCaret = softCaret;
      }
      if (caret) {
        options.caret = caret;
      }

      const placeholderCaret = caret || "_";
      input.placeholder = mask.replaceAll("_", placeholderCaret);

      const phoneMask = new PhoneMask(input, options);
      
      // Помечаем поле как инициализированное, чтобы избежать повторной инициализации
      input.dataset.phoneMaskInitialized = 'true';

      // Функция проверки валидности
      const validatePhone = () => {
        const unmaskedValue = phoneMask.unmask;
        const requiredLength = phoneMask.options.unmaskMaxLength;

        if (unmaskedValue.length < requiredLength) {
          input.setCustomValidity("Введите полный номер телефона");
          input.classList.add("is-invalid");
          input.classList.remove("is-valid");
        } else {
          input.setCustomValidity("");
          input.classList.remove("is-invalid");
          input.classList.add("is-valid");
        }
      };

      // Проверка при вводе и стирании
      input.addEventListener("input", validatePhone);

      // Проверка при потере фокуса
      input.addEventListener("blur", validatePhone);

      // Проверка при попытке отправки формы
      const form = input.closest("form");
      if (form) {
        form.addEventListener("submit", (e) => {
          validatePhone();
          if (!form.checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
          }
          form.classList.add("was-validated");
        });
      }
    });
  },


  /**
   * Qty Input (+/- buttons)
   * Handles cw-qty-v and cw-qty-h quantity input components.
   * Reads data-min / data-max from the input element.
   */
  qtyInput: () => {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-qty-inc],[data-qty-dec]');
      if (!btn) return;
      var wrap = btn.closest('.input-group, .cw-qty-v');
      if (!wrap) return;
      var input = wrap.querySelector('input');
      if (!input) return;
      var val = parseInt(input.value, 10) || 1;
      var min = parseInt(input.dataset.min, 10) || 1;
      var max = parseInt(input.dataset.max, 10) || Infinity;
      if (btn.hasAttribute('data-qty-inc')) val = Math.min(max, val + 1);
      if (btn.hasAttribute('data-qty-dec')) val = Math.max(min, val - 1);
      input.value = val;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  },

  rippleEffect: () => {
    document.querySelectorAll(".has-ripple").forEach((button) => {
      // Проверяем, была ли кнопка уже инициализирована
      if (button.dataset.rippleInitialized === "true") {
        return;
      }

      // Очищаем старые ripple элементы перед инициализацией
      const oldRipples = button.querySelectorAll(".a-ripple");
      oldRipples.forEach(ripple => ripple.remove());

      // Throttle для предотвращения множественных ripple при быстром наведении
      let rippleTimeout = null;
      let lastRippleTime = 0;
      const RIPPLE_THROTTLE = 300; // Минимальный интервал между ripple эффектами (мс)

      // Создаем функцию для создания ripple эффекта
      const createRipple = (e) => {
        const now = Date.now();
        
        // Для mouseenter используем throttle, чтобы не создавать ripple слишком часто
        if (e.type === "mouseenter") {
          // Проверяем, есть ли уже активные ripple элементы
          const existingRipples = button.querySelectorAll(".a-ripple");
          if (existingRipples.length > 0) {
            return; // Не создаем новый ripple, если уже есть активный
          }

          // Throttle: не создаем ripple чаще, чем раз в RIPPLE_THROTTLE мс
          if (now - lastRippleTime < RIPPLE_THROTTLE) {
            return;
          }
          lastRippleTime = now;
        }

        // Очищаем все старые ripple элементы перед созданием нового
        const existingRipples = button.querySelectorAll(".a-ripple");
        existingRipples.forEach(ripple => ripple.remove());

        const rect = button.getBoundingClientRect();
        const ripple = document.createElement("span");
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.className = "a-ripple a-ripple-animate";
        button.appendChild(ripple);
        
        // Автоматически удаляем после завершения анимации
        ripple.addEventListener("animationend", () => {
          ripple.remove();
        });
      };

      // Сохраняем ссылку на функцию для возможности удаления обработчика
      button._rippleHandler = createRipple;
      
      button.addEventListener("click", createRipple);
      button.addEventListener("mouseenter", createRipple);
      button.dataset.rippleInitialized = "true";
    });
  },
};
custom.init();