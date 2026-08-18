---
layout: page
title: Meet the Team
description: The development of Vite is guided by an international team.
---

<script setup>
import {
  VPTeamPage,
  VPTeamPageTitle,
  VPTeamPageSection,
  VPTeamMembers
} from '@voidzero-dev/vitepress-theme'
import { core, advisors, emeriti } from './_data/team'
</script>

<VPTeamPage>
  <VPTeamPageTitle>
    <template #title>Meet the Team</template>
    <template #lead>
      The development of Vite is guided by an international team, some of whom
      have chosen to be featured below.
    </template>
  </VPTeamPageTitle>
  <VPTeamMembers :members="core" />
  <VPTeamPageSection>
    <template #title>Advisors</template>
    <template #lead>
      Advisors help guide Vite from the ecosystem side, sharing their
      experience to shape the Environment API and the design of future APIs.
    </template>
    <template #members>
      <VPTeamMembers size="small" :members="advisors" />
    </template>
  </VPTeamPageSection>
  <VPTeamPageSection>
    <template #title>Team Emeriti</template>
    <template #lead>
      Here we honor some no-longer-active team members who have made valuable
      contributions in the past.
    </template>
    <template #members>
      <VPTeamMembers size="small" :members="emeriti" />
    </template>
  </VPTeamPageSection>
</VPTeamPage>
