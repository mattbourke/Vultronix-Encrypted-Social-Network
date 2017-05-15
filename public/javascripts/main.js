var navbarCollapse = document.querySelector('.navbar-collapse');
var navbarToggle   = document.querySelector('.navbar-toggle');

navbarToggle.addEventListener('click', function() {
    toggleNavbar( document.getElementById("main-nav") );
});

navbarCollapse.addEventListener('click', function() {
    toggleNavbar( document.getElementById("main-nav") );
});

function toggleNavbar(element) {
    toggleClass(element, 'collapse');
    toggleClass(element, '.collapse.in');
}

function toggleClass(element, className) {
    if (element.classList) {
        element.classList.toggle(className);
    }else{
        var classes       = element.className.split(' ');
        var existingIndex = classes.indexOf(className);
        if (existingIndex >= 0) {
            classes.splice(existingIndex, 1);
        }else {
            classes.push(className);
            element.className = classes.join(' ');
        }
    }
}

function toggleChatbox(){
    var display  = '';
    var chatbox  = document.querySelector('#chat-0001');
    toggleClass(chatbox, 'showChatbox');
}
