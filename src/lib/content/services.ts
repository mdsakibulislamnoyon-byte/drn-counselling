import type { ComponentType, SVGProps } from 'react';
import {
  IconHeart,
  IconFamily,
  IconGroup,
  IconCompass,
  IconShieldPlus,
  IconMedal,
  IconClipboardCheck,
  IconMapPin,
} from '@/components/marketing/service-icons';

export interface ServiceInfo {
  slug: string;
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const SERVICES: ServiceInfo[] = [
  {
    slug: 'one-on-one-therapy',
    title: 'One-on-One Therapy Sessions',
    description:
      'At our core is the belief that the needs of every patient must come first. Pain disrupts your life. We will help you eliminate your pain and return to an active, productive lifestyle — and we will do it with compassion. Our one-on-one sessions are 100% confidential.',
    icon: IconHeart,
  },
  {
    slug: 'family-counseling',
    title: 'Family Counseling',
    description:
      'Family is one of the most important things in our lives. Family counseling aims to promote understanding and collaboration among family members in order to solve the problems of one or more individuals. We work with you to rebuild strong, healthy relationships.',
    icon: IconFamily,
  },
  {
    slug: 'group-counseling',
    title: 'Group Counseling',
    description:
      'Group counseling is a wonderful way to give and receive support. Our providers encourage participants to share struggles, lean on each other, and find ways to overcome challenges together. Groups include Domestic Violence, Trauma-Informed CBT, Mindfulness, and more.',
    icon: IconGroup,
  },
  {
    slug: 'mentorship',
    title: 'Mentorship',
    description:
      "Forming relationships with mentors can be one of the most satisfying and professionally helpful activities you pursue. You'll have access to a team of counselors to help you figure out what to achieve and give you the support you need to get there.",
    icon: IconCompass,
  },
  {
    slug: 'substance-addiction-counseling',
    title: 'Substance & Addiction Counseling',
    description:
      'Our substance abuse counselors specialize in treating patients who have a chemical dependency on drugs or alcohol. Whether counseling addicts or those who fear they may become one, we work to help overcome dependencies and become self-sufficient.',
    icon: IconShieldPlus,
  },
  {
    slug: 'veteran-counseling',
    title: 'Veteran Counseling',
    description:
      "Nothing is more important than supporting the health and well-being of the Nation's Veterans and their families. We provide timely access to high-quality, evidence-based mental health care during service members' reintegration into civilian life and beyond.",
    icon: IconMedal,
  },
  {
    slug: 'dwi-oasas-assessments',
    title: 'DWI OASAS Assessments',
    description:
      'As an approved provider for DWI OASAS Assessments, we discuss the rationale for standardizing clinical screening and assessment services for impaired driving clients, and identify the impact of personal attitudes, values, and beliefs on the process.',
    icon: IconClipboardCheck,
  },
  {
    slug: 'mobile-counseling-services',
    title: 'Mobile Counseling Services',
    description:
      'We rapidly connect individuals and families in Central New York with qualified mobile counselors. Our mobile services bring professional mental health support directly to you, wherever you are in the region.',
    icon: IconMapPin,
  },
];
