'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { KidsDecor } from '@/components/kids-decor';
import { Heart, Sparkles, ShieldCheck, Users, Star, Quote } from 'lucide-react';
import { WavySeparator } from '@/components/ui/wavy-separator';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background relative overflow-x-hidden">
      <Navbar />
      <KidsDecor />
      
      {/* Hero Header */}
      <div className="bg-[linear-gradient(135deg,#F0F9FF,#E0F2FE)] pt-24 md:pt-32 pb-8 md:pb-12 text-center border-b border-sky-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[10px] font-black text-sky-600 uppercase tracking-[0.3em] mb-2 md:mb-3 block">The Heart of GiftArtStudio</span>
            <h1 className="text-3xl md:text-6xl font-headline font-black text-slate-800 mb-3 md:mb-4">
              Our <span className="text-sky-600 italic">Story</span>
            </h1>
            <p className="text-sm md:text-lg text-slate-500 max-w-2xl mx-auto font-medium italic">
              "Creating magical keepsakes for life's most precious milestones."
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-14 max-w-6xl relative z-10">
        
        {/* Meet Rohan Section */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center mb-6 md:mb-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-4 md:space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-50 text-sky-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Star className="h-3.5 w-3.5 fill-sky-600" />
              Meet the Founder
            </div>
            <h2 className="text-2xl md:text-4xl font-headline font-black text-slate-800 leading-tight">
              A Personal Journey <br />
              <span className="text-sky-600 italic">By Rohan</span>
            </h2>
            <div className="space-y-3.5 md:space-y-4 text-slate-600 leading-relaxed font-medium text-sm md:text-base">
              <p>
                Hi, I'm <span className="text-slate-900 font-black underline decoration-sky-200 underline-offset-4">Rohan</span>, the founder and owner of GiftArtStudio. My journey started in 2018 with a simple realization: in a world of mass production, the true magic lies in the personal touch.
              </p>
              <p>
                I've always been passionate about craftsmanship and the joy that a thoughtful gift can bring to a child's face. GiftArtStudio was born from the desire to create more than just products—I wanted to create companions for childhood adventures and keepsakes that families would cherish forever.
              </p>
              <p>
                Every backpack, lunch bag, and personalized accessory that leaves our studio is a piece of my vision. I personally ensure that we use only the highest quality materials and the safest inks, because your children deserve nothing but the absolute best.
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative aspect-[4/5] bg-white rounded-3xl md:rounded-[3rem] overflow-hidden shadow-lg border-8 md:border-[12px] border-white group">
              <Image 
                src="https://picsum.photos/seed/rohan-owner/800/1000" 
                alt="Rohan - Founder of GiftArtStudio" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                data-ai-hint="owner founder"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sky-900/40 to-transparent" />
              <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 text-white">
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] opacity-80">Founder & Owner</p>
                <h3 className="text-2xl md:text-3xl font-headline font-black">Rohan</h3>
              </div>
            </div>
            {/* Decorative Element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent/20 rounded-full blur-2xl -z-10" />
          </motion.div>
        </div>

        <WavySeparator className="my-2 md:my-6" />

        {/* Philosophy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-10 md:mb-16">
          {[
            { 
              icon: Heart, 
              title: "Handcrafted Love", 
              desc: "Every item is meticulously prepared in our boutique studio, ensuring a level of care that machines simply can't replicate." 
            },
            { 
              icon: Sparkles, 
              title: "Uniquely Yours", 
              desc: "Personalization isn't an add-on; it's our core. We believe every child's world should reflect their unique personality." 
            },
            { 
              icon: ShieldCheck, 
              title: "Safe & Durable", 
              desc: "Rohan's promise: we use only child-safe materials and robust stitching meant to last through years of play." 
            }
          ].map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 text-center space-y-4 group"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto text-sky-600 group-hover:rotate-6 transition-transform">
                <item.icon className="h-7 w-7 md:h-8 md:w-8" />
              </div>
              <h4 className="text-base md:text-lg font-headline font-black text-slate-800">{item.title}</h4>
              <p className="text-slate-500 font-medium leading-relaxed italic text-xs md:text-sm">"{item.desc}"</p>
            </motion.div>
          ))}
        </div>

        {/* Commitment Quote */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-slate-900 rounded-3xl md:rounded-[3rem] p-8 md:p-14 text-center space-y-6 md:space-y-8 relative overflow-hidden group shadow-xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px]" />
          
          <Quote className="w-10 h-10 md:w-14 md:h-14 text-sky-400/20 mx-auto" />
          
          <h2 className="text-xl md:text-3xl font-headline font-black text-white leading-relaxed max-w-3xl mx-auto">
            "My goal is to make every gift a milestone, and every unboxing a magical memory for your little ones."
          </h2>
          
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-12 h-1 bg-sky-500 rounded-full" />
            <p className="text-sky-400 font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">Rohan • GiftArtStudio Owner</p>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 mt-10 md:mt-16">
          {[
            { label: "Families Served", val: "50k+", icon: Users },
            { label: "Gifts Crafted", val: "120k+", icon: Heart },
            { label: "Happy Reviews", val: "15k+", icon: Star },
            { label: "Cities Reached", val: "500+", icon: ShieldCheck }
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-1">
              <p className="text-2xl md:text-4xl font-black text-slate-800">{stat.val}</p>
              <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
