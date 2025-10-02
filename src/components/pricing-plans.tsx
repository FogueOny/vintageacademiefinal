"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, Shield, Medal } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const plans = [
  {
    name: "Bronze",
    price: "15 000 FCFA",
    duration: "5 Jours",
    color: "bg-amber-600",
    hoverColor: "hover:bg-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: <Medal className="h-8 w-8 mb-1 text-amber-600" />,
    features: [
      "Compréhension Écrite : 36 tests d'entraînement (+1000 Textes)",
      "Compréhension Orale : 32 tests d'entraînement (+1000 Extraits sonores)",
      "Expression Orale : Corrections Tâche 2 des actualités.",
      "Expression Orale : Corrections Tâche 3 des actualités.",
      "Accès : 5 Jours"
    ]
  },
  {
    name: "Silver",
    price: "30 000 FCFA",
    duration: "30 Jours",
    color: "bg-gray-400",
    hoverColor: "hover:bg-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    icon: <Shield className="h-8 w-8 mb-1 text-gray-500" />,
    features: [
      "Compréhension Écrite : 36 tests d'entraînement (+1000 Textes)",
      "Compréhension Orale : 32 tests d'entraînement (+1000 Extraits sonores)",
      "Expression Orale : Corrections Tâche 2 des actualités.",
      "Expression Orale : Corrections Tâche 3 des actualités.",
      "Accès : 1 Mois"
    ],
    popular: false
  },
  {
    name: "Gold",
    price: "45 000 FCFA",
    duration: "60 Jours",
    color: "bg-yellow-500",
    hoverColor: "hover:bg-yellow-600", 
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: <Crown className="h-8 w-8 mb-1 text-yellow-500" />,
    features: [
      "Compréhension Écrite : 36 tests d'entraînement (+1000 Textes)",
      "Compréhension Orale : 32 tests d'entraînement (+1000 Extraits sonores)",
      "Expression Orale : Corrections Tâche 2 des actualités.",
      "Expression Orale : Corrections Tâche 3 des actualités.",
      "Accès : 2 Mois"
    ],
    popular: true
  }
];

export function PricingPlans() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-3">NOS TESTS SONT TIRÉS DE L'EXAMEN RÉEL DU TCF</h2>
          <p className="text-xl text-gray-600">Faites vos choix, enregistrez vous et commencez aujourd'hui</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              variants={itemVariants}
              className="flex"
            >
              <Card 
                className={`flex-1 flex flex-col rounded-xl overflow-hidden border-2 ${plan.borderColor} ${plan.popular ? "shadow-xl transform md:scale-105" : "shadow-md"}`}
              >
                {plan.popular && (
                  <div className="bg-yellow-500 text-white text-center py-1 font-medium">
                    Plus populaire
                  </div>
                )}

                <div className={`${plan.bgColor} p-6 text-center border-b ${plan.borderColor}`}>
                  <div className="flex justify-center mb-3">{plan.icon}</div>
                  <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                  <div className="text-3xl font-bold mb-1">{plan.price}</div>
                  <p className="text-gray-600">{plan.duration}</p>
                </div>

                <div className="p-6 flex-grow flex flex-col">
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.color} text-white ${plan.hoverColor} transition-transform transform hover:scale-[1.02]`}
                  >
                    S'abonner
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
