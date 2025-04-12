"use client";

import { Disclosure, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { siteConfig } from '@/shared/utils/siteConfig';
import { BsChevronUp } from 'react-icons/bs';
import { LegalSection } from '@/shared/types/legal';

interface LegalContentCardProps {
  sections: LegalSection[];
  defaultOpen?: string;
}

export default function LegalContentCard({ 
  sections,
  defaultOpen = sections[0]?.id 
}: LegalContentCardProps) {
  const { colors } = siteConfig;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full rounded-2xl bg-white p-2 shadow-md backdrop-blur-none text-slate-800"
      style={{
        // Force light theme colors regardless of system preferences
        colorScheme: 'light',
        color: '#334155', // slate-700
        backgroundColor: '#ffffff', // pure white
        forcedColorAdjust: 'none'
      }}
      data-theme="light"
    >
      <div className="mx-auto w-full rounded-lg bg-white">
        {sections.map((section, index) => (
          <Disclosure key={section.id} defaultOpen={section.id === defaultOpen}>
            {({ open }) => (
              <div className={`${index !== 0 ? 'border-t border-slate-100' : ''}`}>
                <Disclosure.Button className="flex w-full justify-between rounded-lg bg-white px-4 py-4 text-left text-sm font-medium focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
                  <div className="flex items-center">
                    <span className="flex items-center justify-center h-8 w-8 rounded-full mr-3" style={{
                      backgroundColor: `${colors.primary}10` // Very light primary color
                    }}>
                      {section.icon}
                    </span>
                    <span className="text-slate-800 font-semibold">{section.title}</span>
                  </div>
                  <BsChevronUp
                    className={`${
                      open ? 'transform rotate-180' : ''
                    } h-5 w-5 text-slate-400 transition-transform duration-200`}
                  />
                </Disclosure.Button>
                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                >
                  <Disclosure.Panel className="px-6 pb-6 pt-2 text-sm">
                    <div className="text-slate-600">{section.content}</div>
                  </Disclosure.Panel>
                </Transition>
              </div>
            )}
          </Disclosure>
        ))}
      </div>
    </motion.div>
  );
} 