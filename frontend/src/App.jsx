/** This file is the website's route map. Layout wraps every page with navigation.
 * Existing public URLs remain available, including both cook-registration URLs.
 */
import { Routes, Route, Navigate } from "react-router-dom";
import Layout, { Protected } from "./components/Layout";
import Home from "./pages/Home";
import Directory from "./pages/Directory";
import ChefDetail from "./pages/ChefDetail";
import Auth from "./pages/Auth";
import Bookings from "./pages/Bookings";
import RegisterChef from "./pages/RegisterChef";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import {
  About,
  Join,
  ContentPage,
  CollectionPage,
  BlogDetail,
  NotFound,
} from "./pages/Content";
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="chef-search" element={<Directory />} />
        <Route path="chef/:id" element={<ChefDetail />} />
        <Route path="services" element={<Services />} />
        <Route path="cook-for-month" element={<Services type="monthly" />} />
        <Route path="one-time-cook" element={<Services type="one-time" />} />
        <Route path="chef-for-party" element={<Services type="party" />} />
        <Route path="join-chefkart" element={<Join />} />
        <Route path="login" element={<Auth />} />
        <Route
          path="register"
          element={
            <Protected>
              <RegisterChef />
            </Protected>
          }
        />
        <Route
          path="register-chef"
          element={<Navigate to="/register" replace />}
        />
        <Route
          path="bookings"
          element={
            <Protected>
              <Bookings />
            </Protected>
          }
        />
        <Route
          path="admin"
          element={
            <Protected admin>
              <Admin />
            </Protected>
          }
        />
        <Route path="contact" element={<Contact />} />
        <Route path="career" element={<Contact type="career" />} />
        <Route
          path="investor-relation"
          element={
            <>
              <ContentPage
                type="investors"
                eyebrow="OUR DIRECTION"
                title="An idea worth sharing."
              />
              <Contact type="investor" />
            </>
          }
        />
        <Route path="about" element={<About />} />
        <Route
          path="blog"
          element={
            <ContentPage
              type="blogs"
              eyebrow="THE KITCHEN JOURNAL"
              title="Good things from the kitchen."
            />
          }
        />
        <Route path="explore/:type" element={<CollectionPage />} />
        <Route path="blog/:id" element={<BlogDetail />} />
        <Route
          path="testimonial"
          element={
            <ContentPage
              type="testimonials"
              eyebrow="AROUND THE TABLE"
              title="A little inspiration."
            />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
