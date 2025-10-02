import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Certifications Professionnelles | Vintage Académie',
  description: 'Préparez-vous aux certifications professionnelles reconnues mondialement avec Vintage Académie - CISCO, PMP, AWS et plus.',
};

export default function CertificationsPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">Certifications Professionnelles</h1>
            <p className="text-xl text-gray-600 mb-8">
              Accélérez votre carrière avec des certifications reconnues mondialement
            </p>
          </div>
        </div>
      </section>

      {/* Certifications Overview */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Nos Programmes de Certification</h2>
            <p className="text-gray-600">
              Chez Vintage Académie, nous proposons une formation complète pour vous préparer 
              aux examens de certification les plus valorisés sur le marché du travail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {/* CISCO Certifications */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 transition-transform hover:scale-105">
              <div className="p-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
              <div className="p-6">
                <div className="w-full h-40 relative flex items-center justify-center mb-6">
                  <div className="bg-blue-50 w-full h-full flex items-center justify-center rounded-lg">
                    <div className="text-blue-500 text-5xl font-bold">CISCO</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">CISCO Networking</h3>
                <ul className="text-gray-600 space-y-2 mb-4">
                  <li className="flex items-center">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>CCNA (Cisco Certified Network Associate)</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>CCNP (Cisco Certified Network Professional)</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>Spécialisations : Enterprise, Security, Data Center</span>
                  </li>
                </ul>
                <Link 
                  href="/services/cisco" 
                  className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors w-full text-center"
                >
                  En savoir plus
                </Link>
              </div>
            </div>

            {/* PMP Certification */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 transition-transform hover:scale-105">
              <div className="p-1 bg-gradient-to-r from-yellow-500 to-red-500" />
              <div className="p-6">
                <div className="w-full h-40 relative flex items-center justify-center mb-6">
                  <div className="bg-yellow-50 w-full h-full flex items-center justify-center rounded-lg">
                    <div className="text-yellow-600 text-5xl font-bold">PMP</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">PMP (Project Management Professional)</h3>
                <ul className="text-gray-600 space-y-2 mb-4">
                  <li className="flex items-center">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>Certification PMI reconnue mondialement</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>Préparation complète à l'examen</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>35 heures de formation requises (PDUs)</span>
                  </li>
                </ul>
                <Link 
                  href="/services/pmp" 
                  className="inline-block bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors w-full text-center"
                >
                  En savoir plus
                </Link>
              </div>
            </div>

            {/* AWS Certification */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 transition-transform hover:scale-105">
              <div className="p-1 bg-gradient-to-r from-orange-500 to-yellow-400" />
              <div className="p-6">
                <div className="w-full h-40 relative flex items-center justify-center mb-6">
                  <div className="bg-orange-50 w-full h-full flex items-center justify-center rounded-lg">
                    <div className="text-orange-500 text-5xl font-bold">AWS</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">AWS Cloud</h3>
                <ul className="text-gray-600 space-y-2 mb-4">
                  <li className="flex items-center">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>AWS Certified Solutions Architect</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>AWS Certified Developer</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>AWS Certified SysOps Administrator</span>
                  </li>
                </ul>
                <Link 
                  href="/services/aws" 
                  className="inline-block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors w-full text-center"
                >
                  En savoir plus
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Pourquoi choisir Vintage Académie ?</h2>
            <p className="text-gray-600">
              Notre approche d'enseignement combine théorie et pratique pour maximiser vos chances de réussite.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Formateurs Experts</h3>
              <p className="text-gray-600">
                Nos instructeurs sont des professionnels certifiés avec une vaste expérience dans leur domaine.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Environnement Pratique</h3>
              <p className="text-gray-600">
                Accès à des laboratoires virtuels et des simulations pour appliquer vos connaissances.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Taux de Réussite Élevé</h3>
              <p className="text-gray-600">
                Plus de 90% de nos étudiants réussissent leur certification du premier coup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-blue-600 rounded-lg text-white p-8 shadow-lg text-center">
            <h2 className="text-3xl font-bold mb-4">Prêt à faire progresser votre carrière ?</h2>
            <p className="mb-6 text-lg">
              Inscrivez-vous aujourd'hui et commencez votre parcours vers une certification professionnelle reconnue.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                href="/contact" 
                className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors"
              >
                Nous contacter
              </Link>
              <Link 
                href="/register" 
                className="bg-orange-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-orange-600 transition-colors"
              >
                S'inscrire maintenant
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
