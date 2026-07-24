# TechVerse India

> A responsive company-discovery platform for Indian tech students, freshers, and developers.

TechVerse India helps visitors explore leading technology companies, compare opportunities, and find roles that match their skills, location, and career stage. The application is built with plain HTML, CSS, and JavaScript—no build step required.

## Highlights

- 466 unique company profiles across India
- Search companies by name
- Filter by role interest, tier, location, technology, salary range, and fresher-friendly roles
- View detailed company information, including roles, tech stack, salary range, locations, and career links
- Save favorites in the browser with `localStorage`
- Compare two companies side by side
- Dark and light themes
- Responsive layouts for mobile, tablet, and desktop

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Lucide icons
- Browser `localStorage`

## Run locally

Clone the repository:

```bash
git clone https://github.com/techmaster050718/TechVerse-India.git
cd TechVerse-India
```

Then open `index.html` in a browser, or use the **Live Server** extension in VS Code.

## Project structure

```text
TechVerse-India/
├── index.html       # Page structure and content
├── css/
│   └── styles.css   # Responsive styling and themes
└── js/
    ├── app.js       # Search, filters, UI state, and interactions
    └── data.js      # Company dataset
```

## Updating the company dataset

Company records live in `js/data.js`. Each record requires an `id`, company information, locations, roles, tech stack, compensation, tags, and a career-page link.

Keep every `id` unique. The interface uses it for favorites, detail views, and comparison.

## Future improvements

- Add more company profiles and locations
- Live job-opening integrations
- Internship and placement resources
- Salary insights and analytics
- User accounts and cross-device saved favorites

## Contributing

Contributions are welcome. Fork the repository, create a branch for your change, and open a pull request.

## Author

Created by [Abhay Ojha](https://github.com/techmaster050718) for Indian tech learners and job seekers.
