'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import type { UserCase } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTranslations } from '@/lib/i18n'

// Mock user cases - Replace with actual data from API
const mockCases: UserCase[] = [
  {
    id: '1',
    imageUrl: 'https://picsum.photos/800/600?random=1',
    prompt: 'A futuristic cityscape at sunset with neon lights reflecting on wet streets, cyberpunk style',
    author: 'Alex Chen',
    category: 'image',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    imageUrl: 'https://picsum.photos/800/600?random=2',
    prompt: 'A serene mountain landscape with a crystal-clear lake, morning mist, photorealistic',
    author: 'Sarah Johnson',
    category: 'image',
    createdAt: '2024-01-14',
  },
  {
    id: '3',
    imageUrl: 'https://picsum.photos/800/600?random=3',
    prompt: 'Abstract art with vibrant colors and geometric patterns, modern minimalist style',
    author: 'Michael Brown',
    category: 'image',
    createdAt: '2024-01-13',
  },
  {
    id: '4',
    imageUrl: 'https://picsum.photos/800/600?random=4',
    prompt: 'A magical forest with bioluminescent plants and fireflies, fantasy art style',
    author: 'Emma Wilson',
    category: 'image',
    createdAt: '2024-01-12',
  },
  {
    id: '5',
    imageUrl: 'https://picsum.photos/800/600?random=5',
    prompt: 'A vintage coffee shop interior with warm lighting and cozy atmosphere, cinematic',
    author: 'David Lee',
    category: 'image',
    createdAt: '2024-01-11',
  },
  {
    id: '6',
    imageUrl: 'https://picsum.photos/800/600?random=6',
    prompt: 'A space station orbiting Earth with astronauts and stars in the background, sci-fi',
    author: 'Lisa Anderson',
    category: 'image',
    createdAt: '2024-01-10',
  },
  {
    id: '7',
    imageUrl: 'https://picsum.photos/800/600?random=7',
    prompt: 'A majestic dragon soaring through clouds above ancient temples, epic fantasy art',
    author: 'James Taylor',
    category: 'image',
    createdAt: '2024-01-09',
  },
  {
    id: '8',
    imageUrl: 'https://picsum.photos/800/600?random=8',
    prompt: 'A minimalist modern architecture with clean lines and natural light, Scandinavian design',
    author: 'Sophie Martinez',
    category: 'image',
    createdAt: '2024-01-08',
  },
]

export function UserCases() {
  const { language } = useLanguage()
  const t = getTranslations(language)

  return (
    <section className="py-24 bg-white">
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t.userCases.title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t.userCases.description}
          </p>
        </motion.div>

        {/* Large Image Showcase - Apple-style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {mockCases.slice(0, 4).map((userCase, index) => (
            <motion.div
              key={userCase.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              {/* Large Image */}
              <div className="relative w-full aspect-[4/3] mb-6 rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
                <Image
                  src={userCase.imageUrl}
                  alt={userCase.prompt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>

              {/* Prompt */}
              <p className="text-base text-gray-700 mb-2 font-medium leading-relaxed">
                "{userCase.prompt}"
              </p>

              {/* Author & Date */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="font-semibold">{userCase.author}</span>
                <span>{new Date(userCase.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {mockCases.slice(4).map((userCase, index) => (
            <motion.div
              key={userCase.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: (index + 4) * 0.1 }}
              className="group cursor-pointer"
            >
              {/* Large Image */}
              <div className="relative w-full aspect-[4/3] mb-6 rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
                <Image
                  src={userCase.imageUrl}
                  alt={userCase.prompt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>

              {/* Prompt */}
              <p className="text-base text-gray-700 mb-2 font-medium leading-relaxed">
                "{userCase.prompt}"
              </p>

              {/* Author & Date */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="font-semibold">{userCase.author}</span>
                <span>{new Date(userCase.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <Link
            href="/generate"
            className="btn-secondary inline-block"
          >
            {t.userCases.createYourOwn}
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

