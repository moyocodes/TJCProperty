export default function Footer() {
  return (
    <footer className="bg-secondary-900 text-white">
      <div className="container py-16 grid md:grid-cols-4 gap-10">

        {/* Company */}
        <div>
          <h3 className="font-heading text-xl mb-4">
            TJC <span className="text-primary">Properties</span>
          </h3>
          <p className="text-secondary-200">
            Trusted real estate services in Ibadan offering property sales,
            lettings, and project management.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-heading mb-4">Quick Links</h4>
          <ul className="space-y-2 text-secondary-200">
            <li><a href="#" className="hover:text-primary">Home</a></li>
            <li><a href="#" className="hover:text-primary">Properties</a></li>
            <li><a href="#" className="hover:text-primary">Services</a></li>
            <li><a href="#" className="hover:text-primary">Contact</a></li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="font-heading mb-4">Services</h4>
          <ul className="space-y-2 text-secondary-200">
            <li>Property Sales</li>
            <li>Lettings</li>
            <li>Project Management</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-heading mb-4">Contact</h4>
          <ul className="space-y-2 text-secondary-200">
            <li>Ibadan, Nigeria</li>
            <li>tokunbojames@yahoo.com</li>
            <li>Instagram: @tjc_properties</li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="border-t border-secondary-700">
        <div className="container py-6 text-center text-secondary-300 text-sm">
          © {new Date().getFullYear()} TJC Properties. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}