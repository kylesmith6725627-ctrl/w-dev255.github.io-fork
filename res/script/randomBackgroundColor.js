function randomColor() {
	let color = Math.floor(Math.random() * 0x1000000);
	let esadecimal = color.toString(16).padStart(6, '0');
	return `#${esadecimal}`;
}

const button = document.createElement('button');
button.style.backgroundColor = '#000000';
button.style.color = 'green';
button.style.fontFamily = 'monospace';
button.style.border = '3px solid green';
button.style.padding = '10px';
button.textContent = 'Change color';
button.className = 'test';

button.addEventListener("click", () => {
	document.body.style.backgroundColor = randomColor();
});

document.body.appendChild(button);

