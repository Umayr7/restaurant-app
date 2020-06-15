function selectedActive(elem) {
        var selectedAttr = $(elem),
                selectionID = "." + $(selectedAttr).data("select");

        $(".selecton a").removeClass("active");
        $(selectedAttr).addClass("active");
        $(".food-menu").removeClass("active");

        if (selectionID == ".*") $(".food-menu").addClass("active");
        else $(selectionID).addClass("active");
}


function enableCounterUp(a) {
        var counterElement;
        if (isExists('#counter')) {
                counterElement = $('#counter');
        }
        else {
                return;
        }
        var oTop = $('#counter').offset().top - window.innerHeight;
        if (a == 0 && $(window).scrollTop() > oTop) {
                $('.counter-value').each(function () {
                        var $this = $(this),
                                countDuration = $this.data('duration'),
                                countTo = $this.attr('data-count');
                        $({countNum: $this.text()}).animate({countNum: countTo}, {
                                duration: countDuration,
                                easing: 'swing',
                                step: function () {
                                        $this.text(Math.floor(this.countNum));
                                },
                                complete: function () {
                                        $this.text(this.countNum);
                                }
                        });
                });
                a = 1;
        }
        return a;
}

function panelAccordian(){

        var panelTitle = $('.panel-title');
        panelTitle.on('click', function(){
                $(this).toggleClass('active');
                return false;
        });

}


function enableRadialProgress(){
        $(".radial-progress").each(function(){
                var $this = $(this),
                        progPercent = $this.data('prog-percent');

                var bar = new ProgressBar.Circle(this, {
                        color: '#fff',
                        strokeWidth: 3,
                        trailWidth: 0,
                        easing: 'easeInOut',
                        duration: 1400,
                        text: {},
                        from: { color: '#fff', width: 1 },
                        to: { color: '#EF002E', width: 3 },
                        // Set default step function for all animate calls
                        step: function(state, circle) {
                                circle.path.setAttribute('stroke', state.color);
                                circle.path.setAttribute('stroke-width', state.width);

                                var value = Math.round(circle.value() * 100);
                                if (value === 0) { circle.setText(''); } else { circle.setText(value); }
                        }
                });

                $(this).waypoint(function(){ bar.animate(progPercent); },{offset: "90%"})
        });
}

(function ($) {

        "use strict";

        // ACCORDIAN

        panelAccordian();

        // RADIAL PROGRESS BAR
        enableRadialProgress();

        enableSwiper();

        /*COUNTER*/
        var countLineProgress = 0;
        var countCounterUp = 0;
        var a = 0;
        countCounterUp = enableCounterUp(countCounterUp);

        $(window).on('scroll', function () {
                countCounterUp = enableCounterUp(countCounterUp);
        });

        /*CUSTOME ISOTOPE*/
        var selectedAttr = $('[data-select].active');
        selectedActive(selectedAttr);

        $('[data-select]').on("click", function () {
                var selectedAttr = $(this);
                selectedActive(selectedAttr);
                return false;
        });


        // DROPDOWN MENU

        var winWidth = $(window).width();
        dropdownMenu(winWidth);

        $(window).on('resize', function () {
                winWidth = $(window).width();
                dropdownMenu(winWidth);

        });


        $('[data-menu]').on('click', function () {

                var mainMenu = $(this).data('menu');

                $(mainMenu).toggleClass('visible-menu');

        });


})(jQuery);


function dropdownMenu(winWidth) {

        if (winWidth > 767) {

                $('.main-menu li.drop-down').on('mouseover', function () {
                        var $this = $(this),
                                menuAnchor = $this.children('a');

                        menuAnchor.addClass('mouseover');

                }).on('mouseleave', function () {
                        var $this = $(this),
                                menuAnchor = $this.children('a');

                        menuAnchor.removeClass('mouseover');
                });

        } else {

                $('.main-menu li.drop-down > a').on('click', function () {

                        if ($(this).attr('href') == '#') return false;
                        if ($(this).hasClass('mouseover')) {
                                $(this).removeClass('mouseover');
                        }
                        else {
                                $(this).addClass('mouseover');
                        }
                        return false;
                });
        }

}

function enableSwiper() {

        if (isExists('.swiper-container')) {

                $('.swiper-container').each(function (index) {

                        var swiperDirection = $(this).data('swiper-direction'),
                                swiperSlidePerView = $(this).data('swiper-slides-per-view'),
                                swiperBreakpoints = $(this).data('swiper-breakpoints'),
                                swiperSpeed = $(this).data('swiper-speed'),
                                swiperCrossFade = $(this).data('swiper-crossfade'),
                                swiperLoop = $(this).data('swiper-loop'),
                                swiperAutoplay = $(this).data('swiper-autoplay'),
                                swiperMousewheelControl = $(this).data('swiper-wheel-control'),
                                swipeSlidesPerview = $(this).data('slides-perview'),
                                swiperMargin = parseInt($(this).data('swiper-margin')),
                                swiperSlideEffect = $(this).data('slide-effect'),
                                swiperAutoHeight = $(this).data('autoheight'),
                                swiperScrollbar = ($(this).data('scrollbar') ? $(this).parentsUntil('.swiper-area').find('.swiper-scrollbar') : null);
                        swiperScrollbar = (isExists(swiperScrollbar) ? swiperScrollbar : null),
                                swprResponsive = $(this).data('swpr-responsive');

                        var swiper = new Swiper($(this)[0], {
                                pagination: $(this).find('.swiper-pagination'),
                                slidesPerView: (swiperSlidePerView ? swiperSlidePerView : 1),
                                direction: (swiperDirection ? swiperDirection : 'horizontal'),
                                loop: (swiperLoop ? swiperLoop : false),
                                nextButton: '.swiper-button-next',
                                prevButton: '.swiper-button-prev',
                                autoplay: (swiperAutoplay ? swiperAutoplay : false),
                                paginationClickable: true,
                                spaceBetween: (swiperMargin ? swiperMargin : 0),
                                mousewheelControl: ((swiperMousewheelControl) ? swiperMousewheelControl : false),
                                scrollbar: (swiperScrollbar ? swiperScrollbar : null),
                                scrollbarHide: false,
                                speed: (swiperSpeed ? swiperSpeed : 1000),
                                autoHeight: ((swiperAutoHeight == false) ? swiperAutoHeight : true),
                                effect: (swiperSlideEffect ? swiperSlideEffect : 'coverflow'),
                                fade: {crossFade: swiperCrossFade ? swiperCrossFade : false},
                                breakpoints: {
                                        1200: {slidesPerView: swprResponsive[3] ? swprResponsive[3] : 1,},
                                        992: {slidesPerView: swprResponsive[2] ? swprResponsive[2] : 1,},
                                        768: {slidesPerView: swprResponsive[1] ? swprResponsive[1] : 1,},
                                        576: {slidesPerView: swprResponsive[0] ? swprResponsive[0] : 1,}

                                },
                        });

                        $('.swiper-container').hover(function () {
                                swiper.stopAutoplay();
                        }, function () {
                                swiper.startAutoplay();
                        });


                });


        }
}

function isExists(elem) {
        if ($(elem).length > 0) {
                return true;
        }
        return false;
}

function initMap() {

        // Create a map object, and include the MapTypeId to add
        // to the map type control.

        var uluru = {lat: 56.946285, lng: 24.105078};
        var map = new google.maps.Map(document.getElementById('map'), {
                zoom: 4,
                center: uluru
        });

        var image = 'images/google-marker.png';
        var marker = new google.maps.Marker({
                position: uluru,
                map: map,
                icon: image
        });
        //Associate the styled map with the MapTypeId and set it to display.
        map.mapTypes.set('styled_map', styledMapType);
        map.setMapTypeId('styled_map');
}

// *************************************************************


// const forms = document.getElementsByClassName('pizza_forms');
// const forms_list = Array.from(forms);
// // When user adds a pizza to the cart
// forms_list.map((form) => {
//         form.addEventListener('submit', (event) => {
//                 event.preventDefault();
//                 const radioList = form.getElementsByTagName('input');
//                 let cartItemStr = '';
//                 for(let i=0; i<radioList.length; i++) {
//                         if(radioList[i].checked) {
//                                 cartItemStr = radioList[i].value;
//                                 break;
//                         }
//                 }
//                 const cartItemRawArray = cartItemStr.split('_');
//                 const cartItemObj = {
//                         'id': cartItemRawArray[0],
//                         'size': cartItemRawArray[1],
//                         'flavour': cartItemRawArray[2],
//                         'price': parseFloat(cartItemRawArray[3]),
//                         'quantity': 1,
//                 };
//                 saveDataToStorage(cartItemObj);
//         });
// });

// const clearCartBtn = document.getElementById('clear_cart');
// if (clearCartBtn) {
//                 clearCartBtn.addEventListener('click', e => {
//                 e.preventDefault();
//                 localStorage.removeItem('cartItems');
//                 console.log('cleared local storage');
//                 showSnackbar('Cart is now empty');
//         });
// }

// const table = document.getElementById('table');
// if (table) {
//         let cartItems = localStorage.getItem('cartItems');
//         cartItems = JSON.parse(cartItems);
//         let itemsListHTML = '';
//         let totalAmount = 0;
//         if(cartItems) {
//                 cartItems.forEach((cartItem, index) => {
//                         let itemHTML = `<tr>
//                           <th scope="row">${index+1}</th>
//                           <td>${cartItem.flavour}</td>
//                           <td>${cartItem.price}</td>
//                           <td>${cartItem.quantity}x</td>
//                           <td>${cartItem.price*cartItem.quantity}</td>
//                         </tr>`;
//                         totalAmount += cartItem.price * cartItem.quantity;
//                         itemsListHTML = itemsListHTML.concat(itemHTML);
//                 });
//                 itemsListHTML = itemsListHTML.concat(`<tr>
//                           <th scope="row"></th>
//                           <td></td>
//                           <td></td>
//                           <td class="font-weight-bold">Total amount:</td>
//                           <td class="font-weight-bold">Rs.${totalAmount}</td>
//                         </tr>`);
//                 let tableBody = table.children[1];
//                 tableBody.innerHTML = itemsListHTML;
//         } else {
//                 table.parentElement.innerHTML = `<h3 class="">Your cart is empty</h3>`;
//         }
// }

// const placeOrderForm = document.getElementById('order-form');
// if (placeOrderForm) {
//         placeOrderForm.addEventListener('submit', async (event) => {
//                 event.preventDefault();
//                 // Display progress indicator instead of 'place order' button
//                 const placeOrderBtn = document.getElementById('place-order-btn');
//                 placeOrderBtn.innerHTML = `
//                         <div class="spinner-border text-danger" role="status">
//                           <span class="sr-only">Loading...</span>
//                         </div>
//                 `;
//                 const form = document.getElementById('order-form');
//                 let formData = new FormData(form);
//                 const orderInfo = {
//                         'name': formData.get('name'),
//                         'email': formData.get('email'),
//                         'address': formData.get('address'),
//                         'instructions': formData.get('instructions'),
//                 };
//                 await placeOrder(orderInfo).then(() => {
//                         // if everything went fine, empty the cart
//                         localStorage.removeItem('cartItems');
//                         // Change inside html to successful msg
//                         placeOrderBtn.innerHTML = `
//                             <i style="font-size: 100px; color: green;" class="material-icons">done</i>
//                             <h4>Your order has been placed successfully!</h4>
//                         `;
//                 }, (errorMsg) => {
//                         placeOrderBtn.innerHTML = `
//                             <i style="font-size: 100px; color: red;" class="material-icons">error</i>
//                             <h4>Something went wrong, Please refresh the page and try again.</h4>
//                         `;
//                         console.log(errorMsg);
//                 });
//         })
// }

// async function placeOrder(orderInfo) {
//         const cartItems = JSON.parse(localStorage.getItem('cartItems'));
//         const payload = {
//                 'cartItems': cartItems,
//                 'orderInfo': orderInfo,
//         };
//         // Sending request here
//         const http = new XMLHttpRequest();
//         await http.open('POST', ORDER_URL, true);
//         http.setRequestHeader(`X-CSRFToken`, CSRF_TOKEN);
//         return new Promise(async (resolve, reject) => {
//                 http.onload = function () {
//                   // getting the status of the request to make sure everything went fine
//                   // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/status
//                   console.log('DONE: ', http.status, http.responseText);
//                   if (http.status !== 200) {
//                           reject(http.responseText);
//                   } else {
//                           resolve();
//                   }
//                 };
//                 await http.send(JSON.stringify(payload));
//         });
// }

// function saveDataToStorage(obj) {
//         // TODO: add option to remove the cartItem after certain period of time
//         // let dateNow = new Date();
//         // dateNow.setHours(dateNow.getHours() + 1);

//         let data = localStorage.getItem('cartItems');
//         data = JSON.parse(data);
//         let dataArray = [];
//         if (data === null) {
//                 console.log('data null executed');
//                 dataArray = [obj];
//                 console.log(dataArray);
//         } else {
//                 dataArray = data;
//                 let alreadyContainsInd = containsCartItem(dataArray, obj['id'], obj['size']);
//                 if (alreadyContainsInd === -1) {
//                         dataArray.push(obj);
//                 } else {
//                         dataArray[alreadyContainsInd]['quantity'] += 1;
//                 }
//                 console.log(dataArray);
//         }
//         localStorage.setItem('cartItems', JSON.stringify(dataArray));
//         showSnackbar('Added item to the cart');
// }

// function containsId(arr, id) {
//         for (let i=0; i<arr.length; i++) {
//                 if(arr[i]['id'] === id) {
//                         return i;
//                 }
//         }
//         return -1;
// }

// function showSnackbar(msg) {
//         let x = document.getElementById('snackbar');
//         if (x.classList.contains('show')) {
//                 // if one snackbar is already showing, hide that one and then
//                 // redisplay the new one
//                 // TODO: not working as intended, replace with css toast
//                 // x.className = '';
//                 // setTimeout(() => {return 0}, 500);
//         }
//         x.innerHTML = msg;
//         x.className = 'show';
//         setTimeout(function(){x.className = x.className.replace('show','');}, 3000);
// }

// function containsCartItem(cartItemsArr, id, size) {
//         for(let i=0; i<cartItemsArr.length; i++) {
//                 if(cartItemsArr[i]['id'] === id && cartItemsArr[i]['size'] === size) {
//                         return i;
//                 }
//         }
//         return -1;
// }