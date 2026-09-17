const path = {
	"C": "pages/c.html",
	"Tools": "pages/tools.html",
	"Music": "pages/music.html",
	"Goals": "pages/goals.html",
	"Elettrotecnica": "pages/elettrotecnica.html",
	"Quiz": "pages/quiz_elettrotecnica.html",
	"SystemsAndNetwork": "pages/systems_and_network.html",
	"test": "pages/test.html",
	"Agent": "pages/agent.html",
	"Query": "pages/valid_query.html"
};

const error = {
	"404": "pages/404.html"
}

let input = document.createElement('input');
input.style.backgroundColor = '#000000';
input.style.color = 'green';
input.style.fontFamily = 'monospace';
input.style.border = '3px solid green';
input.style.padding = '6px';
input.style.height = '50px';
input.style.width = '150px';
input.type = 'search';
input.placeholder = '...';

document.body.appendChild(input);

let btn = document.createElement("button");
btn.type = "submit";
btn.textContent = "🔎";
btn.style.backgroundColor = "black";
btn.style.color = "green";
btn.style.fontFamily = "monospace";
btn.style.border = "3px solid green";
input.style.height = '50px';
input.style.width = '25px';
btn.style.padding = "6px";

input.insertAdjacentElement("afterend", btn);

btn.addEventListener("click", () => {
	let buffer = input.value;

	if (path[buffer]) {
		window.location.href = path[buffer];
	} else {
		window.location.href = error["404"];
	}
});

