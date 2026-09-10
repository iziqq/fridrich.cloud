<script setup lang="ts">
import AboutSection from '@/sections/AboutSection.vue';
import ContactSection from '@/sections/ContactSection.vue';
import HeroSection from '@/sections/HeroSection.vue';
import ProcessSection from '@/sections/ProcessSection.vue';
import ProjectsSection from '@/sections/ProjectsSection.vue';
import ServicesSection from '@/sections/ServicesSection.vue';
</script>

<template>
  <HeroSection />
  <AboutSection />
  <ServicesSection />
  <ProcessSection />
  <!-- Sekce Reference přibude sem, až budou reálné citace klientů. -->
  <ProjectsSection />
  <ContactSection />
</template>
