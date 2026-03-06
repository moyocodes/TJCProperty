import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);

  const links = [
    { name: "Home", href: "#" },
    { name: "Properties", href: "#" },
    { name: "Services", href: "#" },
    { name: "About", href: "#" },
    { name: "Contact", href: "#" },
  ];

  return (
    <header className="bg-white border-b border-neutral-gray">
      <div className="container flex items-center justify-between py-4">
        {/* Logo */}
        <div className="font-heading text-xl text-secondary-900">
          TJC <span className="text-primary">Properties</span>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-neutral-dark hover:text-primary transition"
            >
              {link.name}
            </a>
          ))}

          <button className="btn-primary">Get In Touch</button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-secondary-900"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-neutral-gray">
          <div className="container flex flex-col py-4 gap-4">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-neutral-dark hover:text-primary"
              >
                {link.name}
              </a>
            ))}

            <button className="btn-primary w-full">Get In Touch</button>
          </div>
        </div>
      )}
    </header>
  );
}
