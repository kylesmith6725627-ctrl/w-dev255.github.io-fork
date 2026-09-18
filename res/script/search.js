const path = {
	C: "pages/c.html",
	Tools: "pages/tools.html",
	Music: "pages/music.html",
	Goals: "pages/goals.html",
	Elettrotecnica: "pages/elettrotecnica.html",
	Quiz: "pages/quiz_elettrotecnica.html",
	SystemsAndNetwork: "pages/systems_and_network.html",
	test: "pages/test.html",
	Agent: "pages/agent.html",
	Query: "pages/valid_query.html"
};

const form = document.querySelector('.retro_box');
const input = document.querySelector('#site-search');

if (form && input) {
	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const query = input.value.trim();
		const destination = path[query] || 'pages/404.html';
		window.location.assign(destination);
	});
}
