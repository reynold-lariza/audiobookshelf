<template>
  <div class="page" :class="streamLibraryItem ? 'streaming' : ''">
    <app-book-shelf-toolbar page="bay" />
    
    <div class="p-4 md:p-8 max-w-(--breakpoint-2xl) mx-auto">
      <div class="flex items-center mb-8">
        <span class="material-symbols text-4xl mr-4 text-accent">anchor</span>
        <h1 class="text-3xl font-semibold">The Bay</h1>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <ui-loading-indicator />
      </div>
      
      <div v-else>
        <div class="flex flex-wrap items-center mb-6 -mx-2">
          <div class="px-2 w-full md:w-64 mb-4 md:mb-0">
            <ui-dropdown v-model="selectedCategory" :items="categoryOptions" label="Category" small />
          </div>
          <div class="px-2">
            <ui-btn small @click="fetchItems">Refresh</ui-btn>
          </div>
        </div>

        <div v-if="items.length === 0" class="flex flex-col items-center justify-center py-20 opacity-50">
          <span class="material-symbols text-6xl mb-4">search_off</span>
          <p class="text-xl italic">{{ message }}</p>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-8">
          <div v-for="item in items" :key="item.id" class="w-full">
            <!-- Bay item card will go here -->
            <div class="relative rounded-lg overflow-hidden shadow-lg bg-primary/20 aspect-3/4">
               <img :src="item.coverUrl" class="w-full h-full object-cover" />
            </div>
            <p class="mt-2 font-semibold truncate">{{ item.title }}</p>
            <p class="text-sm opacity-70 truncate">{{ item.author }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  async asyncData({ params }) {
    return {
      libraryId: params.library
    }
  },
  data() {
    return {
      loading: true,
      items: [],
      categories: [],
      selectedCategory: 'All',
      message: ''
    }
  },
  computed: {
    streamLibraryItem() {
      return this.$store.state.streamLibraryItem
    },
    categoryOptions() {
      return ['All', ...this.categories].map(c => ({ text: c, value: c }))
    }
  },
  methods: {
    async fetchItems() {
      this.loading = true
      try {
        const data = await this.$axios.$get(`/api/libraries/${this.libraryId}/bay`)
        this.items = data.items || []
        this.categories = data.categories || []
        this.message = data.message || ''
      } catch (error) {
        console.error('Failed to fetch bay items', error)
        this.$toast.error('Failed to fetch bay items')
      } finally {
        this.loading = false
      }
    }
  },
  mounted() {
    this.fetchItems()
  }
}
</script>
