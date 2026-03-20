<script setup lang="ts">
import type { LatLng, NavigatrMap, NavigatrMarker } from '@navigatr/web'

const { getNavigatr } = useNavigatr()

interface Listing {
  id: string
  location: LatLng
  address: string
  title: string
  description: string
  price: number
  bedrooms: number
  bathrooms: number
  sqft: number
  images: string[]
  pinIcon: string | null
  marker?: NavigatrMarker
}

let map: NavigatrMap | null = null
let tempMarker: NavigatrMarker | null = null

const listings = ref<Listing[]>([])
const selectedListing = ref<Listing | null>(null)
const popupListing = ref<Listing | null>(null)
const popupPosition = ref<{ x: number; y: number } | null>(null)
const isAddingListing = ref(false)

// Form state
const formLocation = ref<LatLng | null>(null)
const formAddress = ref('')
const formTitle = ref('')
const formDescription = ref('')
const formPrice = ref<number | null>(null)
const formBedrooms = ref(3)
const formBathrooms = ref(2)
const formSqft = ref<number | null>(null)
const formImages = ref<string[]>([])
const formPinIcon = ref<string | null>(null)

const addressInput = ref('')

function handleAddressSelect(result: { lat: number; lng: number; displayName: string; name?: string }) {
  formLocation.value = { lat: result.lat, lng: result.lng }
  formAddress.value = result.displayName
  addressInput.value = result.name || result.displayName.split(',')[0]

  if (map) {
    map.panTo({ lat: result.lat, lng: result.lng })
    updateTempMarker()
  }
}

async function handleMapClick(location: LatLng) {
  // Close popup when clicking on map
  closePopup()

  if (!isAddingListing.value) return

  formLocation.value = location

  try {
    const nav = await getNavigatr()
    const result = await nav.reverseGeocode(location)
    formAddress.value = result.displayName
    addressInput.value = result.displayName.split(',')[0]
  } catch {
    formAddress.value = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
    addressInput.value = 'Dropped pin'
  }

  updateTempMarker()
}

function updateTempMarker() {
  if (!map || !formLocation.value) return

  if (tempMarker) {
    tempMarker.remove()
  }

  const iconHtml = formPinIcon.value
    ? `<img src="${formPinIcon.value}" style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);" />`
    : undefined

  tempMarker = map.addMarker({
    ...formLocation.value,
    label: 'New Listing',
    draggable: true,
    iconHtml,
    onDragEnd: async (loc) => {
      formLocation.value = loc
      try {
        const nav = await getNavigatr()
        const result = await nav.reverseGeocode(loc)
        formAddress.value = result.displayName
        addressInput.value = result.displayName.split(',')[0]
      } catch {
        formAddress.value = `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`
        addressInput.value = 'Dropped pin'
      }
    }
  })
}

function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  Array.from(input.files).forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        formImages.value.push(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  })
}

function removeImage(index: number) {
  formImages.value.splice(index, 1)
}

function handlePinIconUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    if (e.target?.result) {
      formPinIcon.value = e.target.result as string
      updateTempMarker()
    }
  }
  reader.readAsDataURL(file)
}

function removePinIcon() {
  formPinIcon.value = null
  updateTempMarker()
}

function startAddListing() {
  isAddingListing.value = true
  selectedListing.value = null
  resetForm()
}

function cancelAddListing() {
  isAddingListing.value = false
  if (tempMarker) {
    tempMarker.remove()
    tempMarker = null
  }
  resetForm()
}

function resetForm() {
  formLocation.value = null
  formAddress.value = ''
  formTitle.value = ''
  formDescription.value = ''
  formPrice.value = null
  formBedrooms.value = 3
  formBathrooms.value = 2
  formSqft.value = null
  formImages.value = []
  formPinIcon.value = null
  addressInput.value = ''
}

function saveListing() {
  if (!formLocation.value || !formTitle.value || !formPrice.value) return

  const newListing: Listing = {
    id: Date.now().toString(),
    location: formLocation.value,
    address: formAddress.value,
    title: formTitle.value,
    description: formDescription.value,
    price: formPrice.value,
    bedrooms: formBedrooms.value,
    bathrooms: formBathrooms.value,
    sqft: formSqft.value || 0,
    images: [...formImages.value],
    pinIcon: formPinIcon.value
  }

  // Remove temp marker and add permanent one
  if (tempMarker) {
    tempMarker.remove()
    tempMarker = null
  }

  if (map) {
    addListingMarker(newListing)
  }

  listings.value.push(newListing)
  isAddingListing.value = false
  resetForm()
}

function addListingMarker(listing: Listing) {
  if (!map) return

  const iconHtml = listing.pinIcon
    ? `<div class="listing-marker" data-listing-id="${listing.id}" style="cursor: pointer;"><img src="${listing.pinIcon}" style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);" /></div>`
    : `<div class="listing-marker" data-listing-id="${listing.id}" style="width: 32px; height: 32px; background: var(--accent, #00FF94); border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer;">🏠</div>`

  listing.marker = map.addMarker({
    ...listing.location,
    iconHtml
  })
}

function showListingPopup(listing: Listing, event: MouseEvent) {
  popupListing.value = listing

  const mapContainer = document.getElementById('real-estate-map')
  if (mapContainer) {
    const rect = mapContainer.getBoundingClientRect()
    popupPosition.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }
}

function closePopup() {
  popupListing.value = null
  popupPosition.value = null
}

function viewMoreFromPopup() {
  if (popupListing.value) {
    selectListing(popupListing.value)
    closePopup()
  }
}

function selectListing(listing: Listing) {
  selectedListing.value = listing
  isAddingListing.value = false
  closePopup()

  if (map) {
    map.panTo(listing.location)
  }
}

function deleteListing(listing: Listing) {
  if (listing.marker) {
    listing.marker.remove()
  }
  listings.value = listings.value.filter(l => l.id !== listing.id)
  if (selectedListing.value?.id === listing.id) {
    selectedListing.value = null
  }
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(price)
}

onMounted(async () => {
  const { Navigatr } = await import('@navigatr/web')
  const nav = new Navigatr()

  map = nav.map({
    container: 'real-estate-map',
    center: { lat: 5.6037, lng: -0.1870 },
    zoom: 13
  })

  map.onClick(handleMapClick)

  // Event delegation for marker clicks
  const mapContainer = document.getElementById('real-estate-map')
  if (mapContainer) {
    mapContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const markerEl = target.closest('.listing-marker') as HTMLElement
      if (markerEl) {
        e.stopPropagation()
        const listingId = markerEl.dataset.listingId
        const listing = listings.value.find(l => l.id === listingId)
        if (listing) {
          showListingPopup(listing, e)
        }
      }
    })
  }
})

onUnmounted(() => {
  if (tempMarker) tempMarker.remove()
  listings.value.forEach(l => l.marker?.remove())
})
</script>

<template>
  <div class="real-estate-demo">
    <div class="map-section">
      <div id="real-estate-map" class="map-container" @click="closePopup"></div>
      <div v-if="isAddingListing" class="map-hint">
        Click on the map to set the property location
      </div>

      <!-- Listing Popup -->
      <Transition name="popup">
        <div
          v-if="popupListing && popupPosition"
          class="listing-popup"
          :style="{
            left: `${Math.min(popupPosition.x, 280)}px`,
            top: `${Math.max(popupPosition.y - 220, 10)}px`
          }"
          @click.stop
        >
          <button class="popup-close" @click="closePopup">×</button>

          <!-- Thumbnails -->
          <div v-if="popupListing.images.length > 0" class="popup-images">
            <img
              v-for="(img, index) in popupListing.images.slice(0, 3)"
              :key="index"
              :src="img"
              alt="Property"
              class="popup-thumb"
            />
            <div v-if="popupListing.images.length > 3" class="popup-more-images">
              +{{ popupListing.images.length - 3 }}
            </div>
          </div>
          <div v-else class="popup-no-images">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>

          <div class="popup-content">
            <h4>{{ popupListing.title }}</h4>
            <p class="popup-price">{{ formatPrice(popupListing.price) }}</p>
            <div class="popup-stats">
              <span>{{ popupListing.bedrooms }} bd</span>
              <span>{{ popupListing.bathrooms }} ba</span>
              <span v-if="popupListing.sqft">{{ popupListing.sqft.toLocaleString() }} sqft</span>
            </div>
          </div>

          <button class="popup-view-more" @click="viewMoreFromPopup">
            View Details
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </Transition>
    </div>

    <div class="panel-section">
      <!-- Header -->
      <div class="panel-header">
        <h2>Property Listings</h2>
        <button v-if="!isAddingListing" class="add-btn" @click="startAddListing">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Listing
        </button>
      </div>

      <!-- Add Listing Form -->
      <div v-if="isAddingListing" class="add-form">
        <h3>New Listing</h3>

        <!-- Location -->
        <div class="form-section">
          <label class="form-label">Location</label>
          <AddressSearch
            v-model="addressInput"
            placeholder="Search address or click map..."
            @select="handleAddressSelect"
          />
          <p v-if="formLocation" class="location-hint">
            {{ formAddress }}
          </p>
        </div>

        <!-- Title -->
        <div class="form-section">
          <label class="form-label">Property Title</label>
          <input
            v-model="formTitle"
            type="text"
            class="form-input"
            placeholder="e.g., Modern 3BR Apartment"
          />
        </div>

        <!-- Property Details -->
        <div class="form-section">
          <label class="form-label">Property Details</label>
          <div class="details-grid">
            <div class="detail-field">
              <span class="detail-label">Beds</span>
              <div class="stepper">
                <button @click="formBedrooms = Math.max(0, formBedrooms - 1)">-</button>
                <span>{{ formBedrooms }}</span>
                <button @click="formBedrooms++">+</button>
              </div>
            </div>
            <div class="detail-field">
              <span class="detail-label">Baths</span>
              <div class="stepper">
                <button @click="formBathrooms = Math.max(0, formBathrooms - 1)">-</button>
                <span>{{ formBathrooms }}</span>
                <button @click="formBathrooms++">+</button>
              </div>
            </div>
            <div class="detail-field">
              <span class="detail-label">Sq Ft</span>
              <input
                v-model.number="formSqft"
                type="number"
                class="sqft-input"
                placeholder="1500"
              />
            </div>
          </div>
        </div>

        <!-- Price -->
        <div class="form-section">
          <label class="form-label">Price ($)</label>
          <input
            v-model.number="formPrice"
            type="number"
            class="form-input"
            placeholder="250000"
          />
        </div>

        <!-- Description -->
        <div class="form-section">
          <label class="form-label">Description</label>
          <textarea
            v-model="formDescription"
            class="form-textarea"
            placeholder="Describe the property..."
            rows="3"
          ></textarea>
        </div>

        <!-- Pin Icon Upload -->
        <div class="form-section">
          <label class="form-label">Custom Pin Icon</label>
          <div class="upload-area pin-upload">
            <input
              type="file"
              accept="image/*"
              class="file-input"
              @change="handlePinIconUpload"
            />
            <div v-if="!formPinIcon" class="upload-placeholder">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Upload pin image</span>
            </div>
            <div v-else class="pin-preview">
              <img :src="formPinIcon" alt="Pin icon" />
              <button class="remove-pin" @click.stop="removePinIcon">×</button>
            </div>
          </div>
        </div>

        <!-- Property Images Upload -->
        <div class="form-section">
          <label class="form-label">Property Images</label>
          <div class="images-grid">
            <div
              v-for="(img, index) in formImages"
              :key="index"
              class="image-preview"
            >
              <img :src="img" alt="Property" />
              <button class="remove-image" @click="removeImage(index)">×</button>
            </div>
            <label class="image-upload-btn">
              <input
                type="file"
                accept="image/*"
                multiple
                class="file-input"
                @change="handleImageUpload"
              />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
              <span>Add Photos</span>
            </label>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button class="cancel-btn" @click="cancelAddListing">Cancel</button>
          <button
            class="save-btn"
            :disabled="!formLocation || !formTitle || !formPrice"
            @click="saveListing"
          >
            Save Listing
          </button>
        </div>
      </div>

      <!-- Selected Listing View -->
      <div v-else-if="selectedListing" class="listing-detail">
        <button class="back-btn" @click="selectedListing = null">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to listings
        </button>

        <div v-if="selectedListing.images.length > 0" class="detail-images">
          <img :src="selectedListing.images[0]" alt="Property" class="main-image" />
          <div v-if="selectedListing.images.length > 1" class="thumbnail-row">
            <img
              v-for="(img, index) in selectedListing.images.slice(1, 4)"
              :key="index"
              :src="img"
              alt="Property"
              class="thumbnail"
            />
          </div>
        </div>

        <div class="detail-content">
          <h3>{{ selectedListing.title }}</h3>
          <p class="detail-price">{{ formatPrice(selectedListing.price) }}</p>
          <p class="detail-address">{{ selectedListing.address }}</p>

          <div class="detail-stats">
            <span>{{ selectedListing.bedrooms }} beds</span>
            <span>{{ selectedListing.bathrooms }} baths</span>
            <span v-if="selectedListing.sqft">{{ selectedListing.sqft.toLocaleString() }} sqft</span>
          </div>

          <p v-if="selectedListing.description" class="detail-description">
            {{ selectedListing.description }}
          </p>

          <button class="delete-btn" @click="deleteListing(selectedListing)">
            Delete Listing
          </button>
        </div>
      </div>

      <!-- Listings List -->
      <div v-else class="listings-list">
        <div v-if="listings.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
          <p>No listings yet</p>
          <span>Click "Add Listing" to create your first property</span>
        </div>

        <div
          v-for="listing in listings"
          :key="listing.id"
          class="listing-card"
          @click="selectListing(listing)"
        >
          <div class="listing-image">
            <img v-if="listing.images.length > 0" :src="listing.images[0]" alt="Property" />
            <div v-else class="no-image">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
          </div>
          <div class="listing-info">
            <h4>{{ listing.title }}</h4>
            <p class="listing-price">{{ formatPrice(listing.price) }}</p>
            <p class="listing-stats">
              {{ listing.bedrooms }} bd • {{ listing.bathrooms }} ba
              <span v-if="listing.sqft"> • {{ listing.sqft.toLocaleString() }} sqft</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.real-estate-demo {
  display: flex;
  width: 100%;
  height: 600px;
  border-radius: 16px;
  overflow: hidden;
  background: #1a1a1a;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.map-section {
  flex: 1;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  backdrop-filter: blur(8px);
}

.panel-section {
  width: 380px;
  background: #111;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #2a2a2a;
}

.panel-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: var(--accent, #00FF94);
  border: none;
  border-radius: 8px;
  color: #111;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
}

.add-btn:hover {
  opacity: 0.9;
}

/* Form Styles */
.add-form {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.add-form h3 {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 20px;
}

.form-section {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #888;
  margin-bottom: 8px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 14px;
  background: #222;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent, #00FF94);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #555;
}

.form-textarea {
  resize: none;
}

.location-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-label {
  font-size: 12px;
  color: #666;
}

.stepper {
  display: flex;
  align-items: center;
  background: #222;
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
}

.stepper button {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.15s;
}

.stepper button:hover {
  background: #333;
}

.stepper span {
  flex: 1;
  text-align: center;
  color: #fff;
  font-weight: 500;
}

.sqft-input {
  width: 100%;
  padding: 8px 10px;
  background: #222;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-family: inherit;
}

.sqft-input:focus {
  outline: none;
  border-color: var(--accent, #00FF94);
}

/* Upload Styles */
.upload-area {
  position: relative;
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.pin-upload {
  width: 100px;
  height: 100px;
  border: 2px dashed #333;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}

.pin-upload:hover {
  border-color: #444;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #555;
}

.upload-placeholder span {
  font-size: 11px;
}

.pin-preview {
  position: relative;
  width: 60px;
  height: 60px;
}

.pin-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.remove-pin {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #ff4444;
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Images Grid */
.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.image-preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-upload-btn {
  aspect-ratio: 1;
  border: 2px dashed #333;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  color: #555;
  transition: border-color 0.2s;
  position: relative;
}

.image-upload-btn:hover {
  border-color: #444;
}

.image-upload-btn span {
  font-size: 10px;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #2a2a2a;
}

.cancel-btn {
  flex: 1;
  padding: 14px;
  background: #333;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
}

.cancel-btn:hover {
  background: #444;
}

.save-btn {
  flex: 1;
  padding: 14px;
  background: var(--accent, #00FF94);
  border: none;
  border-radius: 8px;
  color: #111;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
}

.save-btn:hover {
  opacity: 0.9;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Listings List */
.listings-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #555;
  padding: 40px;
}

.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  font-weight: 500;
  color: #888;
  margin: 0 0 4px;
}

.empty-state span {
  font-size: 13px;
}

.listing-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #1a1a1a;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 8px;
}

.listing-card:hover {
  background: #222;
}

.listing-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.listing-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 100%;
  background: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #444;
}

.listing-info {
  flex: 1;
  min-width: 0;
}

.listing-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.listing-price {
  font-size: 16px;
  font-weight: 700;
  color: var(--accent, #00FF94);
  margin: 0 0 4px;
}

.listing-stats {
  font-size: 12px;
  color: #666;
  margin: 0;
}

/* Listing Detail View */
.listing-detail {
  flex: 1;
  overflow-y: auto;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: transparent;
  border: none;
  color: #888;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #fff;
}

.detail-images {
  padding: 0 20px;
}

.main-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
}

.thumbnail-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.thumbnail {
  flex: 1;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.detail-content {
  padding: 20px;
}

.detail-content h3 {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px;
}

.detail-price {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent, #00FF94);
  margin: 0 0 8px;
}

.detail-address {
  font-size: 13px;
  color: #666;
  margin: 0 0 16px;
}

.detail-stats {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid #2a2a2a;
  border-bottom: 1px solid #2a2a2a;
  margin-bottom: 16px;
}

.detail-stats span {
  font-size: 14px;
  color: #888;
}

.detail-description {
  font-size: 14px;
  color: #aaa;
  line-height: 1.6;
  margin: 0 0 24px;
}

.delete-btn {
  width: 100%;
  padding: 14px;
  background: transparent;
  border: 1px solid #ff4444;
  border-radius: 8px;
  color: #ff4444;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #ff4444;
  color: #fff;
}

/* Listing Popup */
.listing-popup {
  position: absolute;
  width: 260px;
  background: rgba(17, 17, 17, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 100;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.popup-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background 0.2s;
}

.popup-close:hover {
  background: rgba(0, 0, 0, 0.7);
}

.popup-images {
  display: flex;
  gap: 2px;
  height: 80px;
  overflow: hidden;
}

.popup-thumb {
  flex: 1;
  height: 100%;
  object-fit: cover;
}

.popup-more-images {
  position: absolute;
  top: 50px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.popup-no-images {
  height: 80px;
  background: #222;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #444;
}

.popup-content {
  padding: 12px 14px;
}

.popup-content h4 {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.popup-price {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent, #00FF94);
  margin: 0 0 8px;
}

.popup-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #888;
}

.popup-stats span {
  display: flex;
  align-items: center;
}

.popup-view-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--accent, #00FF94);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
}

.popup-view-more:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Popup Transition */
.popup-enter-active,
.popup-leave-active {
  transition: all 0.2s ease;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}
</style>
