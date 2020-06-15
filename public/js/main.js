(function($) {

	"use strict";

	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	$('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
  });

})(jQuery);

submitForms = function(){
    document.getElementById("form1").submit();
    document.getElementById("form2").submit();
}

setTimeout(function() {
    $('#mydiv1,#mydiv2,#mydiv3,#mydiv4,#mydiv5,#mydiv6,#mydiv7,#messages').fadeOut('slow');
}, 1000); // <-- time in milliseconds