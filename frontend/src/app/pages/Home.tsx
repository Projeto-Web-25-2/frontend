import { ArrowRight, Sparkles, Truck, CreditCard, BookOpen } from 'lucide-react';
import { Link } from 'react-router';
import { products } from '../data/products';
import { ProductCard } from '../components/ProductCard';

export const Home = () => {
  const featuredProducts = products.filter((p) => p.featured).slice(0, 6);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6">
                Domine o Futuro com <span className="text-yellow-300">Inteligência Artificial</span>
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                A COMPIA é a editora líder em publicações de Inteligência Artificial, oferecendo conteúdo de alta qualidade para estudantes e profissionais.
              </p>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Explorar Catálogo
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop"
                alt="Inteligência Artificial"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                <Truck className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Entrega Rápida</h3>
              <p className="text-gray-600">
                Livros físicos entregues em todo o Brasil. E-books disponíveis imediatamente após a compra.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Pagamento Seguro</h3>
              <p className="text-gray-600">
                Aceitamos todas as bandeiras de cartão e PIX. Suas informações estão protegidas.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-4">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Conteúdo de Qualidade</h3>
              <p className="text-gray-600">
                Autores renomados e conteúdo técnico atualizado com as últimas tendências em IA.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-semibold uppercase">Destaques</span>
              </div>
              <h2 className="text-3xl font-bold">Livros em Destaque</h2>
            </div>
            <Link
              to="/catalog"
              className="hidden md:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Ver todos
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Ver todos os livros
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* About COMPIA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&h=600&fit=crop"
                alt="Sobre a COMPIA"
                className="rounded-lg shadow-lg"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Sobre a COMPIA Editora</h2>
              <p className="text-gray-700 mb-4">
                A COMPIA Editora é uma iniciativa voltada para a publicação e disseminação de conteúdos de alta qualidade na área de Inteligência Artificial.
              </p>
              <p className="text-gray-700 mb-4">
                Nosso propósito é oferecer livros, revistas e materiais digitais que auxiliem tanto estudantes quanto profissionais a aprofundarem seus conhecimentos em temas como arquitetura de software inteligente, blockchain, criptografia e cibersegurança.
              </p>
              <p className="text-gray-700 mb-6">
                Unimos rigor técnico com uma linguagem acessível, tornando-nos uma ponte entre o mundo acadêmico e o mercado de trabalho.
              </p>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Conheça nossos livros
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
