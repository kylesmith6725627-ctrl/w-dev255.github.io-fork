document.body.style.backgroundColor = '#000000';
document.body.style.border = '3px solid green';
document.body.style.padding = '6px';

let icon = document.createElement('img');
icon.src = "res/img/w-dev255_black_icon.jpg";
icon.className = 'icon';
icon.id = '302181985915867';
document.body.appendChild(icon);
document.addEventListener('DOMContentLoaded', () => {
        let immage = document.getElementById('302181985915867');
        immage.style.position = 'absolute';
        immage.style.top = '1';
        immage.style.left = '5';
});

let search_icon = document.querySelector('.icon');
search_icon.style.height = '50px';
search_icon.style.width = '75px';

