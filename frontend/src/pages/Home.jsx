/** Landing page uses real API data and a bundled image; no remote image dependency. */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { ChefCard, DataState, Empty, HowItWorks, Icon } from "../components/UI";
export default function Home() {
  const [city, setCity] = useState("Bengaluru");
  const navigate = useNavigate();
  const chefs = useApi("/chefs");
  return (
    <>
      <section className="hero-wrap">
        <div className="container hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="tiny-dot" /> FRESHLY COOKED. RIGHT AT HOME.
            </p>
            <h1>
              More home.
              <br />
              Less <span>homework.</span>
            </h1>
            <p className="hero-description">
              Your favourite meals, made in your kitchen.
              <br className="desktop-only" /> Find a cook for the everyday, the
              occasional,
              <br className="desktop-only" /> and everything worth celebrating.
            </p>
            <form
              className="location-search"
              onSubmit={(event) => {
                event.preventDefault();
                navigate(
                  `/chef-search?city=${encodeURIComponent(city.trim())}`,
                );
              }}
            >
              <Icon name="pin" />
              <div>
                <label htmlFor="home-city">WHERE’S YOUR KITCHEN?</label>
                <input
                  id="home-city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Enter your city"
                  maxLength={100}
                />
              </div>
              <button className="btn" type="submit">
                Find a cook <Icon name="arrow" size={18} />
              </button>
            </form>
            <div className="hero-notes">
              <span>
                <Icon name="check" size={16} />
                Your ingredients
              </span>
              <span>
                <Icon name="check" size={16} />
                Your preferences
              </span>
              <span>
                <Icon name="check" size={16} />
                Your schedule
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-orbit" />
            <span className="visual-label">
              A little help.
              <br />
              <strong>A lot of heart.</strong>
            </span>
            <img
              className="hero-image"
              src="/assets/kitchen.png"
              alt="A home cook beside a freshly prepared meal"
              fetchPriority="high"
            />
            <div className="floating-note">
              <span className="note-icon">
                <Icon name="bowl" size={25} />
              </span>
              <div>
                <strong>Made your way</strong>
                <small>There’s no place like home.</small>
              </div>
            </div>
            <span className="visual-caption">
              GOOD FOOD STARTS IN YOUR KITCHEN
            </span>
          </div>
        </div>
      </section>
      <div className="container promise-strip">
        <p>
          <Icon name="chef" />
          Cooks for every occasion
        </p>
        <p>
          <Icon name="calendar" />
          Flexible service choices
        </p>
        <p>
          <Icon name="bowl" />
          Meals made around you
        </p>
      </div>
      <div className="container">
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">HOW CAN WE HELP?</p>
              <h2>One kitchen. So many possibilities.</h2>
            </div>
            <Link className="text-link" to="/services">
              Explore services <Icon name="arrow" size={18} />
            </Link>
          </div>
          <div className="service-grid">
            {[
              [
                "calendar",
                "THE EVERYDAY",
                "A cook for your month",
                "A familiar helping hand for your daily meals.",
                "/cook-for-month",
                "01",
              ],
              [
                "bowl",
                "THE OCCASIONAL",
                "A cook for one visit",
                "Take a break. Let someone else do the cooking.",
                "/one-time-cook",
                "02",
              ],
              [
                "chef",
                "THE CELEBRATION",
                "A chef for your party",
                "More time with your guests. Less time in the kitchen.",
                "/chef-for-party",
                "03",
              ],
            ].map(([icon, label, title, description, url, n]) => (
              <Link className="service-card" to={url} key={url}>
                <div className="service-card-top">
                  <span className="service-icon">
                    <Icon name={icon} size={28} />
                  </span>
                  <span>{n}</span>
                </div>
                <p className="eyebrow">{label}</p>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="service-action">
                  Discover more <Icon name="arrow" size={18} />
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className="section cooks-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MEET YOUR NEXT KITCHEN PARTNER</p>
              <h2>Good food begins with good people.</h2>
            </div>
            <Link to="/chef-search" className="text-link">
              Meet the cooks <Icon name="arrow" size={18} />
            </Link>
          </div>
          <DataState query={chefs}>
            {chefs.data?.length ? (
              <div className="chef-grid">
                {chefs.data.slice(0, 4).map((chef) => (
                  <ChefCard key={chef._id} chef={chef} />
                ))}
              </div>
            ) : (
              <Empty title="Our directory is getting started">
                Create a cook profile to appear here.
              </Empty>
            )}
          </DataState>
        </section>
        <HowItWorks />
        <section className="join-banner">
          <div>
            <p className="eyebrow">LOVE TO COOK?</p>
            <h2>
              Your next opportunity
              <br />
              could start in a kitchen.
            </h2>
            <p>Tell us about your skills. Make a profile. Get discovered.</p>
          </div>
          <Link to="/join-chefkart" className="btn dark">
            Cook with us <Icon name="arrow" size={18} />
          </Link>
        </section>
      </div>
    </>
  );
}
