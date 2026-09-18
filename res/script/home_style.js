const styles = document.createElement('style');
styles.textContent = `
	:root {
		color-scheme: dark;
		--green: #00c853;
		--dim-green: #087f3c;
		--black: #000;
		--muted: #8bd9a8;
	}

	* { box-sizing: border-box; }

	body {
		margin: 0;
		min-height: 100vh;
		padding: clamp(1rem, 4vw, 2rem);
		background: var(--black);
		color: var(--green);
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		line-height: 1.5;
		border: 3px solid var(--dim-green);
	}

	a { color: var(--green); }
	a:hover, a:focus-visible { color: #fff; }
	.site-header, main, .social-links { width: min(100%, 58rem); margin-inline: auto; }
	.site-header { display: flex; align-items: center; gap: 1.25rem; padding-bottom: 3rem; }
	.brand { flex: 0 0 auto; }
	.icon { display: block; width: 5rem; height: 5rem; object-fit: cover; border: 2px solid var(--green); image-rendering: auto; }
	.eyebrow { margin: 0; color: var(--muted); font-size: .8rem; }
	h1, h2 { margin: 0; letter-spacing: .08em; }
	h1 { font-size: clamp(1.5rem, 5vw, 2.5rem); }
	h2 { font-size: 1.15rem; }
	.welcome { border-left: 3px solid var(--green); padding: .25rem 1rem; margin-bottom: 2rem; }
	.welcome p { margin: .35rem 0 0; color: var(--muted); }
	.retro_box { border: 3px solid var(--green); padding: 1rem; max-width: 32rem; }
	.retro_box label { display: block; margin-bottom: .6rem; }
	.search-controls { display: flex; gap: .5rem; }
	input, button { border: 2px solid var(--green); background: var(--black); color: var(--green); font: inherit; min-height: 2.5rem; }
	input { width: 100%; padding: .45rem .65rem; }
	button { padding: .35rem .75rem; cursor: pointer; }
	button:hover, button:focus-visible { background: var(--green); color: var(--black); }
	.retro_box small { display: block; margin-top: .7rem; color: var(--muted); font-size: .72rem; }
	.social-links { display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--dim-green); }
	:focus-visible { outline: 2px dashed #fff; outline-offset: 3px; }

	@media (max-width:  thirtyrem) {
		.site-header { align-items: flex-start; padding-bottom: 2rem; }
	}
`;
document.head.appendChild(styles);
