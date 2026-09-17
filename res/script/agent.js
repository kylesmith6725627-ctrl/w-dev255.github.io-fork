document.body.style.backgroundColor = '#000000';
document.body.style.border = '3px solid green';

let buffer = [];

let command = [];
let output = [];

let commandArea = document.createElement('textarea');
commandArea.className = 'input_metod';
commandArea.id = '1438223782977';
commandArea.style.backgroundColor = '#000000';
commandArea.style.color = 'green';
commandArea.style.fontFamily = 'monospace';
commandArea.style.height = '5rem'
commandArea.style.width = '10rem';
document.body.appendChild(commandArea);

let button = document.createElement('button');
button.style.type = 'submit';
button.style.className = 'input_metod';
button.style.id = '6695881929728';
button.style.backgroundColor = '#000000';
button.style.color = 'green';
button.style.fontFamily = 'monospace';
button.style.border = '3px solid green';
button.style.padding = '6px';
document.body.appendChild(button);

button.addEventListener('click', () => {
	if (commandArea.value.trim().length === 0) {
		return;
	}
	buffer.push(commandArea.value.trim());
});
