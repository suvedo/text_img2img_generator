import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="footer mt-auto py-3 bg-light">
      <div className="container">
        <div className="row">
          <div className="col-md-4">
            <h5>About Us</h5>
            <p className="">
              We are committed to providing the highest quality AI image generation services, making creativity limitless.
            </p>
          </div>
          <div className="col-md-4">
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              <li><Link href="/">Home</Link></li>
              <li><Link href="#pricingAera">Pricing</Link></li>
              <li><Link href="#">Contact Us</Link></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h5>Follow Us</h5>
            <div className="social-links">
              <a href="#" className="me-2"><i className="fab fa-twitter"></i></a>
              <a href="#" className="me-2"><i className="fab fa-facebook"></i></a>
              <a href="#" className="me-2"><i className="fab fa-github"></i></a>
            </div>
          </div>
        </div>
        <hr />
        <div className="row">
          <div className="col-12 text-center">
            <p className="mb-0">
              © {new Date().getFullYear()} pixelmyth.shop. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 