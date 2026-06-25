export interface ResumeContactItem {
  label: string;
  value: string;
  href?: string;
}

export interface ResumeEducationItem {
  period?: string;
  degree: string;
  field: string;
}

export interface ResumeProjectItem {
  name: string;
  url?: string;
  description: string;
  technologies: string[];
}

export interface ResumeExperienceItem {
  company: string;
  location: string;
  period: string;
  role: string;
  responsibilities: string[];
}

export interface ResumeData {
  initials: string;
  name: string;
  title: string;
  location: string;
  summary: string;
  contacts: ResumeContactItem[];
  skills: string[];
  education: ResumeEducationItem[];
  projects: ResumeProjectItem[];
  experience: ResumeExperienceItem[];
}

export const resumeData: ResumeData = {
  initials: "SG",
  name: "Sachin Gupta",
  title: "Senior Digital Marketing Executive",
  location: "Mumbai, India",
  summary:
    "Senior Digital Marketing Executive with expertise in Google Ads, SEO, social media marketing, and e-commerce growth. Passionate about vibe coding, building digital products, and using AI tools to improve sales, brand visibility, and business performance.",
  contacts: [
    {
      label: "Phone",
      value: "9120689422",
      href: "tel:+919120689422",
    },
    {
      label: "Email",
      value: "Sachingu444@gmail.com",
      href: "mailto:Sachingu444@gmail.com",
    },
    {
      label: "Location",
      value: "Mumbai, India",
    },
    {
      label: "Website",
      value: "www.sachindia.online",
      href: "https://www.sachindia.online/",
    },
  ],
  skills: [
    "Digital Marketing",
    "SEO & Google Ads",
    "Social Media Ads",
    "E-commerce & Shopify",
    "WordPress",
    "Application Development",
    "Website Design",
    "Vibe Coding",
    "HTML, CSS & React",
    "Prompt Engineering",
    "Figma & UI/UX",
    "Flipkart & Amazon",
  ],
  education: [
    {
      period: "2016 - 2017",
      degree: "Bachelor of Business",
      field: "Accounting",
    },
    {
      degree: "Certification",
      field: "Digital Marketing",
    },
    {
      degree: "Certification",
      field: "Video Editing",
    },
  ],
  projects: [
    {
      name: "Sachin Marketplace",
      url: "https://www.sachindia.online/",
      description:
        "A fully functional online marketplace built independently, showcasing real-world skills in web development, UI and UX design, and e-commerce architecture.",
      technologies: ["React", "HTML & CSS", "E-commerce", "Vibe Coding", "Figma"],
    },
  ],
  experience: [
    {
      company: "Jafry's Metal Stickers",
      location: "Mumbai",
      period: "2025 - Present",
      role: "Digital Marketing Head",
      responsibilities: [
        "Lead end-to-end digital marketing strategy, brand building, and online presence.",
        "Scale paid ads on Google, Meta, and Instagram; manage Flipkart and Amazon.",
        "Oversee SEO, content creation, and creatives to drive qualified traffic.",
        "Use AI tools and analytics to continuously optimize campaigns and ROI.",
      ],
    },
    {
      company: "Muscle Gears Sports Nutrition PVT. LTD",
      location: "Navi Mumbai",
      period: "2023 - 2025",
      role: "Senior Digital Marketing Executive",
      responsibilities: [
        "Designed and maintained company websites.",
        "Managed Google Ads campaigns and social media presence.",
        "Drove e-commerce sales growth on Flipkart and Amazon.",
        "Executed email marketing and SEO strategies.",
      ],
    },
    {
      company: "Webproarts Digital Marketing Agency",
      location: "Vasai",
      period: "2022 - 2023",
      role: "Digital Marketing Executive",
      responsibilities: [
        "Built and managed websites using WordPress.",
        "Handled social media accounts and ad campaigns.",
        "Worked on multiple client-based digital marketing projects.",
      ],
    },
    {
      company: "Global E-Auction Company",
      location: "Delhi",
      period: "2020 - 2021",
      role: "Digital Marketing & Social Media",
      responsibilities: [
        "Developed wedding strategy scheduling and customer outreach.",
        "Acquired online memberships and invited customers for bidding.",
      ],
    },
    {
      company: "Delta Supermarket",
      location: "Mumbai",
      period: "2018 - 2019",
      role: "Inventory Management",
      responsibilities: [
        "Uploaded stock data into computer software for daily sales tracking.",
        "Managed daily reports, accounting, and Tally entries.",
        "Prepared profit and loss accounts and balance sheets.",
      ],
    },
  ],
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const buildResumeHtml = (resume: ResumeData = resumeData) => {
  const contactsMarkup = resume.contacts
    .map(
      (item) => `
        <div class="contact-row">
          <div class="contact-label">${escapeHtml(item.label)}</div>
          <div class="contact-value">${escapeHtml(item.value)}</div>
        </div>
      `
    )
    .join("");

  const skillsMarkup = resume.skills
    .map((skill) => `<span class="skill-pill">${escapeHtml(skill)}</span>`)
    .join("");

  const educationMarkup = resume.education
    .map(
      (item) => `
        <div class="education-item">
          ${item.period ? `<div class="education-period">${escapeHtml(item.period)}</div>` : ""}
          <div class="education-degree">${escapeHtml(item.degree)}</div>
          <div class="education-field">${escapeHtml(item.field)}</div>
        </div>
      `
    )
    .join("");

  const projectsMarkup = resume.projects
    .map(
      (project) => `
        <div class="project-card">
          <div class="project-head">
            <div class="project-name">${escapeHtml(project.name)}</div>
            ${
              project.url
                ? `<div class="project-link">${escapeHtml(
                    project.url.replace(/^https?:\/\//, "")
                  )}</div>`
                : ""
            }
          </div>
          <div class="project-description">${escapeHtml(project.description)}</div>
          <div class="pill-row">
            ${project.technologies
              .map((technology) => `<span class="tech-pill">${escapeHtml(technology)}</span>`)
              .join("")}
          </div>
        </div>
      `
    )
    .join("");

  const experienceMarkup = resume.experience
    .map(
      (job) => `
        <div class="job-row">
          <div class="timeline">
            <div class="dot"></div>
            <div class="line"></div>
          </div>
          <div class="job-body">
            <div class="job-head">
              <div>
                <div class="job-company">${escapeHtml(job.company)}</div>
                <div class="job-location">${escapeHtml(job.location)}</div>
              </div>
              <div class="job-period">${escapeHtml(job.period)}</div>
            </div>
            <div class="job-role">${escapeHtml(job.role)}</div>
            <ul class="job-list">
              ${job.responsibilities
                .map((responsibility) => `<li>${escapeHtml(responsibility)}</li>`)
                .join("")}
            </ul>
          </div>
        </div>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(resume.name)} Resume</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: #eef2f7;
            color: #1d2736;
            padding: 22px;
          }

          .page {
            width: 100%;
            max-width: 1040px;
            margin: 0 auto;
          }

          .hero {
            background: linear-gradient(135deg, #0d1b2a 0%, #102f55 55%, #174b85 100%);
            color: #ffffff;
            padding: 14px 18px;
            border-radius: 22px 22px 0 0;
          }

          .hero-top {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .avatar {
            width: 54px;
            height: 54px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #d6b25e 0%, #f3dfad 100%);
            color: #0d1b2a;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 1px;
          }

          .title {
            font-size: 10px;
            letter-spacing: 1.8px;
            text-transform: uppercase;
            color: #f3c96b;
            margin-top: 4px;
          }

          .name {
            font-size: 24px;
            line-height: 1.1;
            font-weight: 700;
          }

          .summary {
            margin-top: 10px;
            font-size: 10px;
            line-height: 1.55;
            color: rgba(255, 255, 255, 0.86);
          }

          .body {
            display: grid;
            grid-template-columns: 220px minmax(0, 1fr);
            align-items: start;
            gap: 12px;
            padding-top: 12px;
          }

          .sidebar {
            padding: 0;
            min-width: 0;
          }

          .main {
            padding: 0;
            min-width: 0;
          }

          .section {
            margin-bottom: 10px;
            break-inside: avoid;
            page-break-inside: avoid;
            background: #ffffff;
            border: 1px solid #e1e8f0;
            border-radius: 14px;
            padding: 12px;
            box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
          }

          .section:last-child {
            margin-bottom: 0;
          }

          .section-title {
            font-size: 8px;
            letter-spacing: 1.6px;
            text-transform: uppercase;
            color: #9a6f0b;
            font-weight: 700;
            margin-bottom: 6px;
          }

          .contact-row,
          .education-item {
            margin-bottom: 7px;
          }

          .contact-label,
          .education-period {
            font-size: 8px;
            color: #7b8794;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 2px;
          }

          .contact-value,
          .education-degree {
            font-size: 11px;
            color: #1d2736;
            font-weight: 700;
            line-height: 1.35;
            word-break: break-word;
          }

          .education-field {
            font-size: 10px;
            color: #475467;
            margin-top: 2px;
          }

          .pill-row {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
          }

          .skill-pill,
          .tech-pill {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 999px;
            font-size: 8px;
            font-weight: 700;
          }

          .skill-pill {
            background: #fff7e0;
            color: #8a6200;
            border: 1px solid #ecd9a7;
          }

          .tech-pill {
            background: #edf4ff;
            color: #0d4d97;
          }

          .project-card,
          .profile-card {
            background: #ffffff;
            border: 1px solid #e4e7ec;
            border-radius: 10px;
            padding: 9px;
          }

          .project-card,
          .profile-card,
          .contact-row,
          .education-item,
          .hero {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .main-top-grid,
          .experience-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .main-top-grid > div,
          .experience-grid > div {
            min-width: 0;
          }

          .project-head,
          .job-head {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .project-name,
          .job-company {
            font-size: 12px;
            font-weight: 700;
            color: #101828;
          }

          .job-location {
            margin-top: 2px;
            font-size: 9px;
            color: #667085;
          }

          .project-link,
          .job-period {
            font-size: 8px;
            padding: 4px 6px;
            border-radius: 999px;
            background: #f5ead3;
            color: #8a6200;
            font-weight: 700;
          }

          .project-description,
          .profile-card p {
            margin-top: 4px;
            font-size: 10px;
            line-height: 1.45;
            color: #475467;
          }

          .experience-grid {
            display: block;
          }

          .job-row {
            display: grid;
            grid-template-columns: 18px minmax(0, 1fr);
            gap: 8px;
            margin-bottom: 9px;
          }

          .job-row:last-child {
            margin-bottom: 0;
          }

          .timeline {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: #d6a93d;
            margin-top: 4px;
          }

          .line {
            flex: 1;
            width: 1px;
            background: linear-gradient(to bottom, rgba(214, 169, 61, 0.5), rgba(214, 169, 61, 0));
            margin-top: 4px;
          }

          .job-body {
            padding-left: 2px;
          }

          .job-role {
            font-size: 9px;
            color: #667085;
            margin-top: 3px;
            font-style: italic;
          }

          .job-list {
            margin: 4px 0 0;
            padding-left: 14px;
          }

          .job-list li {
            margin-bottom: 2px;
            font-size: 8px;
            line-height: 1.35;
            color: #475467;
          }

          @media screen {
            body {
              background: #eef2f7;
              padding: 24px;
            }

            .page {
              max-width: 900px;
            }

            .job-list li {
              font-size: 10px;
              line-height: 1.45;
            }

            .summary {
              font-size: 12px;
              line-height: 1.6;
            }
          }

          @media screen and (max-width: 780px) {
            body {
              padding: 12px;
            }

            .body {
              grid-template-columns: 1fr;
            }

            .sidebar {
              padding: 0;
            }

            .main-top-grid,
            .experience-grid {
              grid-template-columns: 1fr;
            }
          }

          @media print {
            body {
              padding: 0;
              background: #ffffff;
            }

            .page {
              min-height: calc(297mm - 12mm);
            }

            .body {
              align-items: start;
            }

            .sidebar,
            .main {
              display: block;
            }

            .sidebar .section,
            .main .section {
              margin-bottom: 10px;
              box-shadow: none;
            }

            .sidebar .section:last-child,
            .main .section:last-child {
              margin-bottom: 0;
            }

            .section {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="hero">
            <div class="hero-top">
              <div class="avatar">${escapeHtml(resume.initials)}</div>
              <div>
                <div class="name">${escapeHtml(resume.name)}</div>
                <div class="title">${escapeHtml(resume.title)}</div>
              </div>
            </div>
          </div>

          <div class="body">
            <div class="sidebar">
              <div class="section">
                <div class="section-title">Contact</div>
                ${contactsMarkup}
              </div>

              <div class="section">
                <div class="section-title">Skills</div>
                <div class="pill-row">${skillsMarkup}</div>
              </div>

              <div class="section">
                <div class="section-title">Education</div>
                ${educationMarkup}
              </div>
            </div>

            <div class="main">
              <div class="section main-top-grid">
                <div>
                  <div class="section-title">Profile</div>
                  <div class="profile-card">
                    <p>${escapeHtml(resume.summary)}</p>
                  </div>
                </div>
                <div>
                  <div class="section-title">Projects</div>
                  ${projectsMarkup}
                </div>
              </div>

              <div class="section">
                <div class="section-title">Work Experience</div>
                <div class="experience-grid">${experienceMarkup}</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
