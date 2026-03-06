<template>
  <div class="page" :class="streamLibraryItem ? 'streaming' : ''">
    <app-book-shelf-toolbar page="bay" :search-query="searchQuery" />
    
    <div class="p-4 md:p-8 max-w-(--breakpoint-2xl) mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center">
          <span class="material-symbols text-4xl mr-4 text-accent">anchor</span>
          <h1 class="text-3xl font-semibold">The Bay</h1>
        </div>
        <ui-btn v-if="userIsAdminOrUp" :loading="refreshing" color="bg-primary" small @click="refreshBay">
          <span class="material-symbols text-sm mr-2">refresh</span>
          Refresh All
        </ui-btn>
      </div>

      <div class="flex flex-wrap items-center mb-8 -mx-2">
        <div class="px-2 w-full md:w-64 mb-4 md:mb-0">
          <ui-dropdown v-model="selectedCategory" :items="categoryOptions" label="Category" small @input="fetchItems" />
        </div>
        <div class="px-2 grow max-w-md">
          <form @submit.prevent="fetchItems">
            <ui-text-input v-model="searchQuery" placeholder="Search the bay..." small clearable @input="onSearchInput" />
          </form>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <ui-loading-indicator />
      </div>
      
      <div v-else>
        <div v-if="items.length === 0" class="flex flex-col items-center justify-center py-20 opacity-50 text-center">
          <span class="material-symbols text-6xl mb-4">search_off</span>
          <p class="text-xl italic">{{ message || 'No items found in this category.' }}</p>
          <p v-if="!message" class="text-sm mt-2">Try refreshing or searching for a specific title.</p>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12">
          <div v-for="item in items" :key="item.id" class="w-full flex flex-col group">
            <div class="relative rounded-lg overflow-hidden shadow-xl bg-primary/20 aspect-3/4 transition-transform hover:scale-[1.03]">
               <img :src="item.coverUrl" class="w-full h-full object-cover" />
               
               <!-- Owned Badge -->
               <div v-if="item.isOwned" class="absolute top-2 right-2 bg-success text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                 In Library
               </div>

               <!-- Hover Overlay -->
               <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                 <p class="text-xs text-white/90 line-clamp-4 mb-4">{{ item.description || 'No description available.' }}</p>
                 
                 <ui-btn v-if="item.downloadUrl" color="bg-accent" x-small class="w-full mb-2" @click.stop="openLink(item.downloadUrl)">
                   <span class="material-symbols text-xs mr-1">download</span>
                   Get Magnet
                 </ui-btn>
                 <ui-btn v-else color="bg-primary" x-small class="w-full mb-2" @click.stop="searchABB(item)">
                   <span class="material-symbols text-xs mr-1">search</span>
                   Search Bay
                 </ui-btn>
                 
                 <ui-btn color="bg-white/20" x-small class="w-full" @click.stop="openLink(item.sourceUrl)">
                   <span class="material-symbols text-xs mr-1">open_in_new</span>
                   Audible
                 </ui-btn>
               </div>
            </div>
            <div class="mt-3">
              <p class="font-semibold text-sm md:text-base line-clamp-1 leading-tight mb-0.5" :title="item.title">{{ item.title }}</p>
              <p class="text-xs md:text-sm opacity-60 truncate">{{ item.author }}</p>
              <div class="flex items-center mt-1">
                <span class="text-[10px] px-1.5 py-0.5 bg-white/10 rounded-sm opacity-50 uppercase font-mono">{{ item.type || 'Discovery' }}</span>
              </div>
            </div>
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
      refreshing: false,
      items: [],
      categories: [],
      selectedCategory: 'All',
      searchQuery: '',
      message: '',
      searchTimeout: null
    }
  },
  computed: {
    streamLibraryItem() {
      return this.$store.state.streamLibraryItem
    },
    userIsAdminOrUp() {
      return this.$store.getters['user/getIsAdminOrUp']
    },
    categoryOptions() {
      return ['All', ...this.categories].map(c => ({ text: c, value: c }))
    }
  },
  methods: {
    onSearchInput() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.fetchItems()
      }, 500)
    },
    async fetchItems() {
      this.loading = true
      try {
        const params = {
          category: this.selectedCategory,
          q: this.searchQuery
        }
        const data = await this.$axios.$get(`/api/libraries/${this.libraryId}/bay`, { params })
        this.items = data.items || []
        this.categories = data.categories || []
        this.message = data.message || ''
      } catch (error) {
        console.error('Failed to fetch bay items', error)
        this.$toast.error('Failed to fetch bay items')
      } finally {
        this.loading = false
      }
    },
    async refreshBay() {
      this.refreshing = true
      try {
        await this.$axios.$post(`/api/libraries/${this.libraryId}/bay/refresh`)
        this.$toast.info('Discovery refresh started in background.')
        // Poll for updates every 5 seconds for a bit
        setTimeout(() => this.fetchItems(), 5000)
      } catch (error) {
        console.error('Failed to refresh bay', error)
        this.$toast.error('Failed to refresh bay')
      } finally {
        this.refreshing = false
      }
    },
    openLink(url) {
      if (!url) return
      window.open(url, '_blank')
    },
    searchABB(item) {
      const query = encodeURIComponent(`${item.title} ${item.author}`)
      window.open(`https://audiobookbay.lu/?s=${query}`, '_blank')
    }
  },
  mounted() {
    this.fetchItems()
  }
}
</script>
