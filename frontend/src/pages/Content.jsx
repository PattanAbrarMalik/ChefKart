/** Marketing/editorial pages render text from the same content API as the admin CMS.
 * React renders plain text safely: no dangerouslySetInnerHTML or arbitrary HTML.
 */
import { Link, useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { DataState, Empty, Icon, PageHeading } from "../components/UI";
export function ContentPage({ type, title, eyebrow }) {
  const query = useApi(`/content/${type}`);
  return (
    <div className="container page">
      <PageHeading title={title} eyebrow={eyebrow} />
      <DataState query={query}>
        {query.data?.length ? (
          <div className="editorial-grid">
            {query.data.map((row) => (
              <article className="editorial-card" key={row._id}>
                {row.image && (
                  <img
                    src={row.image}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.src = "/assets/kitchen.png";
                    }}
                  />
                )}
                <div>
                  <p className="eyebrow">{row.category}</p>
                  <h2>{row.title}</h2>
                  <p className="prose muted">
                    {type === "blogs"
                      ? `${row.content.slice(0, 150)}…`
                      : row.content}
                  </p>
                  {type === "blogs" && (
                    <Link className="text-link" to={`/blog/${row._id}`}>
                      Read the story <Icon name="arrow" size={17} />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="More to come">
            New content will appear here when it is published.
          </Empty>
        )}
      </DataState>
    </div>
  );
}
export function BlogDetail() {
  const { id } = useParams();
  const query = useApi(`/content/blogs/${id}`);
  return (
    <div className="container page narrow">
      <Link className="back-link" to="/blog">
        ← Back to journal
      </Link>
      <DataState query={query}>
        {query.data && (
          <article>
            <PageHeading
              eyebrow={query.data.category}
              title={query.data.title}
            />
            <p className="article-body">{query.data.content}</p>
          </article>
        )}
      </DataState>
    </div>
  );
}
export function Join() {
  const query = useApi("/content/join");
  return (
    <div className="container page">
      <div className="join-hero">
        <div>
          <p className="eyebrow">CHEFKART से जुड़ें</p>
          <h1>
            Make a living.
            <br />
            Make someone’s <span>day.</span>
          </h1>
          <p className="lead muted">
            Good cooking is a skill worth sharing. Build a profile and help more
            people discover what you do best.
          </p>
          <Link className="btn" to="/register">
            Register as a cook <Icon name="arrow" size={18} />
          </Link>
        </div>
        <img
          src="/assets/kitchen.png"
          alt="Cook standing proudly beside a meal"
        />
      </div>
      <DataState query={query}>
        <div className="steps">
          {query.data?.map((row) => (
            <article key={row._id}>
              <p className="eyebrow">{row.category}</p>
              <h2>{row.title}</h2>
              <p className="muted">{row.content}</p>
            </article>
          ))}
        </div>
      </DataState>
      <section className="section">
        <h2>A simple start</h2>
        <div className="steps">
          {[
            [
              "01",
              "Create an account",
              "Use your email and a password to sign up.",
            ],
            [
              "02",
              "Tell your story",
              "Add your location, cuisines, experience and availability.",
            ],
            [
              "03",
              "Keep it current",
              "Edit your profile whenever your details change.",
            ],
          ].map(([n, title, text]) => (
            <article key={n}>
              <span className="step-number">{n}</span>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
export function About() {
  return (
    <div className="container page narrow">
      <PageHeading
        eyebrow="ABOUT THE PROJECT"
        title="A little help. A better everyday."
      >
        ChefKart connects the idea of home cooking with a simpler booking
        experience.
      </PageHeading>
      <div className="form-card">
        <h2>What you can do here</h2>
        <p>
          Browse cooks, explore services, create a profile, and manage your
          bookings. Enquiries and editorial content are managed through an
          administrator account.
        </p>
        <h2>Built for learning</h2>
        <p>
          This is an educational project based on the supplied ChefKart code.
          Sample profiles and stories show how the application works; they are
          not real service listings or customer reviews. Bookings are saved in
          the project database. There is no real cook dispatch, payment
          processing, email, or SMS integration.
        </p>
        <Link className="btn" to="/chef-search">
          Explore the directory
        </Link>
      </div>
    </div>
  );
}
export function NotFound() {
  return (
    <div className="container page">
      <PageHeading eyebrow="404" title="This page isn’t on the menu.">
        The link may have changed. Let’s get you back home.
      </PageHeading>
      <Link className="btn" to="/">
        Back to home
      </Link>
    </div>
  );
}

/** Public preview for every CMS collection, including supporting image galleries. */
export function CollectionPage() {
  const { type } = useParams();
  return (
    <ContentPage
      type={type}
      eyebrow="FROM THE KITCHEN"
      title={type.replaceAll("-", " ")}
    />
  );
}
