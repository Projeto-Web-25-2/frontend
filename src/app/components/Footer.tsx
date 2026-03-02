import { Book, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 text-white mb-4">
              <Book className="w-6 h-6" />
              <span className="text-xl font-bold">COMPIA</span>
            </div>
            <p className="text-sm">
              Editora especializada em Inteligência Artificial, oferecendo conteúdo de alta qualidade para estudantes e profissionais.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="hover:text-white transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">
                  Painel Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contato</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>contato@compia.com.br</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>(11) 9999-9999</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Campina Grande, PB</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} COMPIA Editora. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
