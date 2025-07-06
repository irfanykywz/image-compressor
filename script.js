// Global variables
let selectedFiles = [];
let processedImages = [];

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const filesSection = document.getElementById('filesSection');
const filesList = document.getElementById('filesList');
const processBtn = document.getElementById('processBtn');
const clearBtn = document.getElementById('clearBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultsSection = document.getElementById('resultsSection');
const resultsSummary = document.getElementById('resultsSummary');
const resultsList = document.getElementById('resultsList');
const reprocessBtn = document.getElementById('reprocessBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const newBatchBtn = document.getElementById('newBatchBtn');

// Settings elements
const resizeMode = document.getElementById('resizeMode');
const resizePercentage = document.getElementById('resizePercentage');
const resizeWidth = document.getElementById('resizeWidth');
const resizeHeight = document.getElementById('resizeHeight');
const maxWidth = document.getElementById('maxWidth');
const maxHeight = document.getElementById('maxHeight');
const quality = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const format = document.getElementById('format');
const maintainAspectRatio = document.getElementById('maintainAspectRatio');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeSettings();
});

// Initialize event listeners
function initializeEventListeners() {
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Prevent multiple file dialog openings
    let isDialogOpen = false;
    const openFileDialog = () => {
        if (!isDialogOpen) {
            isDialogOpen = true;
            fileInput.click();
            // Reset flag after a short delay
            setTimeout(() => {
                isDialogOpen = false;
            }, 1000);
        }
    };
    
    uploadArea.addEventListener('click', openFileDialog);
    
    // Override the browse button click to use the same protection
    const browseBtn = document.querySelector('.browse-btn');
    if (browseBtn) {
        browseBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openFileDialog();
        };
    }
    
    // Button events
    processBtn.addEventListener('click', processImages);
    clearBtn.addEventListener('click', clearAll);
    
    // Use event delegation for reprocess button since it's in a hidden section
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'reprocessBtn') {
            reprocessImages();
        }
    });
    
    downloadAllBtn.addEventListener('click', downloadAll);
    newBatchBtn.addEventListener('click', startNewBatch);
    
    // Settings events
    resizeMode.addEventListener('change', updateResizeSettings);
    quality.addEventListener('input', updateQualityValue);
}

// Initialize settings
function initializeSettings() {
    updateResizeSettings();
    updateQualityValue();
}

// Handle file selection
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    addFiles(files);
}

// Handle drag over
function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

// Handle drag leave
function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

// Handle drop
function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
        addFiles(imageFiles);
    } else {
        showNotification('Please select image files only.', 'error');
    }
}

// Add files to the list
function addFiles(files) {
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const fileId = Date.now() + Math.random();
            const fileObj = {
                id: fileId,
                file: file,
                name: file.name,
                size: file.size,
                type: file.type
            };
            
            selectedFiles.push(fileObj);
            displayFile(fileObj);
        }
    });
    
    if (selectedFiles.length > 0) {
        filesSection.style.display = 'block';
        filesSection.classList.add('fade-in');
    }
}

// Display file in the list
function displayFile(fileObj) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item fade-in';
    fileItem.dataset.fileId = fileObj.id;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        fileItem.innerHTML = `
            <img src="${e.target.result}" alt="${fileObj.name}">
            <div class="file-info">
                <div class="file-name">${fileObj.name}</div>
                <div class="file-size">${formatFileSize(fileObj.size)}</div>
            </div>
            <button class="file-remove" onclick="removeFile('${fileObj.id}')">
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        `;
    };
    reader.readAsDataURL(fileObj.file);
    
    filesList.appendChild(fileItem);
}

// Remove file from list
function removeFile(fileId) {
    selectedFiles = selectedFiles.filter(f => f.id !== fileId);
    const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
    if (fileElement) {
        fileElement.remove();
    }
    
    if (selectedFiles.length === 0) {
        filesSection.style.display = 'none';
    }
}

// Clear all files
function clearAll() {
    selectedFiles = [];
    filesList.innerHTML = '';
    filesSection.style.display = 'none';
    resultsSection.style.display = 'none';
    progressSection.style.display = 'none';
    
    // Reset file input to allow selecting the same files again
    fileInput.value = '';
}

// Update resize settings visibility
function updateResizeSettings() {
    const mode = resizeMode.value;
    
    // Hide all resize option groups
    document.getElementById('percentageGroup').style.display = 'none';
    document.getElementById('dimensionsGroup').style.display = 'none';
    document.getElementById('maxWidthGroup').style.display = 'none';
    document.getElementById('maxHeightGroup').style.display = 'none';
    
    // Show relevant group
    switch (mode) {
        case 'percentage':
            document.getElementById('percentageGroup').style.display = 'block';
            break;
        case 'dimensions':
            document.getElementById('dimensionsGroup').style.display = 'block';
            break;
        case 'maxWidth':
            document.getElementById('maxWidthGroup').style.display = 'block';
            break;
        case 'maxHeight':
            document.getElementById('maxHeightGroup').style.display = 'block';
            break;
    }
}

// Update quality value display
function updateQualityValue() {
    qualityValue.textContent = quality.value + '%';
}

// Process images
async function processImages() {
    if (selectedFiles.length === 0) {
        showNotification('Please select files to process.', 'error');
        return;
    }
    
    // Show progress section
    progressSection.style.display = 'block';
    filesSection.style.display = 'none';
    resultsSection.style.display = 'none';
    
    // Reset file input to allow selecting the same files again
    fileInput.value = '';
    
    processedImages = [];
    let processedCount = 0;
    
    for (let i = 0; i < selectedFiles.length; i++) {
        const fileObj = selectedFiles[i];
        
        // Update progress
        const progress = ((i + 1) / selectedFiles.length) * 100;
        progressFill.style.width = progress + '%';
        progressText.textContent = `Processing image ${i + 1} of ${selectedFiles.length}...`;
        
        try {
            const processedImage = await processImage(fileObj);
            processedImages.push(processedImage);
            processedCount++;
        } catch (error) {
            console.error('Error processing image:', error);
            showNotification(`Error processing ${fileObj.name}`, 'error');
        }
    }
    
    // Show results
    displayResults();
}

// Process individual image
async function processImage(fileObj) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            try {
                // Get settings
                const settings = getProcessingSettings();
                
                // Calculate new dimensions
                const newDimensions = calculateNewDimensions(img.width, img.height, settings);
                
                // Set canvas size
                canvas.width = newDimensions.width;
                canvas.height = newDimensions.height;
                
                // Draw image with new dimensions
                ctx.drawImage(img, 0, 0, newDimensions.width, newDimensions.height);
                
                // Convert to blob
                canvas.toBlob((blob) => {
                    const processedImage = {
                        originalFile: fileObj,
                        blob: blob,
                        name: generateOutputFileName(fileObj.name, settings.format),
                        size: blob.size,
                        originalSize: fileObj.size,
                        compressionRatio: ((fileObj.size - blob.size) / fileObj.size * 100).toFixed(1)
                    };
                    resolve(processedImage);
                }, `image/${settings.format}`, settings.quality / 100);
                
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(fileObj.file);
    });
}

// Get processing settings
function getProcessingSettings() {
    return {
        resizeMode: resizeMode.value,
        resizePercentage: parseInt(resizePercentage.value),
        resizeWidth: parseInt(resizeWidth.value),
        resizeHeight: parseInt(resizeHeight.value),
        maxWidth: parseInt(maxWidth.value),
        maxHeight: parseInt(maxHeight.value),
        quality: parseInt(quality.value),
        format: format.value,
        maintainAspectRatio: maintainAspectRatio.checked
    };
}

// Calculate new dimensions
function calculateNewDimensions(originalWidth, originalHeight, settings) {
    let newWidth = originalWidth;
    let newHeight = originalHeight;
    
    switch (settings.resizeMode) {
        case 'percentage':
            const scale = settings.resizePercentage / 100;
            newWidth = Math.round(originalWidth * scale);
            newHeight = Math.round(originalHeight * scale);
            break;
            
        case 'dimensions':
            newWidth = settings.resizeWidth;
            newHeight = settings.resizeHeight;
            break;
            
        case 'maxWidth':
            if (originalWidth > settings.maxWidth) {
                newWidth = settings.maxWidth;
                if (settings.maintainAspectRatio) {
                    newHeight = Math.round((originalHeight * settings.maxWidth) / originalWidth);
                }
            }
            break;
            
        case 'maxHeight':
            if (originalHeight > settings.maxHeight) {
                newHeight = settings.maxHeight;
                if (settings.maintainAspectRatio) {
                    newWidth = Math.round((originalWidth * settings.maxHeight) / originalHeight);
                }
            }
            break;
    }
    
    return { width: newWidth, height: newHeight };
}

// Generate output file name
function generateOutputFileName(originalName, format) {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const extension = format === 'jpeg' ? 'jpg' : format;
    return `${nameWithoutExt}_compressed.${extension}`;
}

// Display results
function displayResults() {
    progressSection.style.display = 'none';
    resultsSection.style.display = 'block';
    resultsSection.classList.add('fade-in');
    
    // Reset file input to allow selecting the same files again
    fileInput.value = '';
    
    // Calculate summary
    const totalOriginalSize = processedImages.reduce((sum, img) => sum + img.originalSize, 0);
    const totalCompressedSize = processedImages.reduce((sum, img) => sum + img.size, 0);
    const totalCompressionRatio = ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(1);
    
    // Display summary
    resultsSummary.innerHTML = `
        <h3>Processing Summary</h3>
        <p><strong>${processedImages.length}</strong> images processed</p>
        <p>Total original size: <strong>${formatFileSize(totalOriginalSize)}</strong></p>
        <p>Total compressed size: <strong>${formatFileSize(totalCompressedSize)}</strong></p>
        <p>Overall compression: <strong>${totalCompressionRatio}%</strong></p>
    `;
    
    // Display individual results
    resultsList.innerHTML = '';
    processedImages.forEach(image => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item fade-in';
        
        const imageUrl = URL.createObjectURL(image.blob);
        resultItem.innerHTML = `
            <img src="${imageUrl}" alt="${image.name}">
            <div class="result-info">
                <div class="result-name" title="${image.name}">${image.name}</div>
                <div class="result-stats">
                    ${formatFileSize(image.originalSize)} → ${formatFileSize(image.size)} (${image.compressionRatio}% smaller)
                </div>
            </div>
            <button class="result-download" onclick="downloadImage('${image.name}', '${imageUrl}')">
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                Download
            </button>
        `;
        
        resultsList.appendChild(resultItem);
    });
}

// Download individual image
function downloadImage(fileName, imageUrl) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download all images as ZIP
async function downloadAll() {
    if (processedImages.length === 0) {
        showNotification('No images to download.', 'error');
        return;
    }
    
    try {
        showNotification('Creating ZIP file...', 'info');
        
        const zip = new JSZip();
        
        // Add each image to the ZIP
        processedImages.forEach((image, index) => {
            zip.file(image.name, image.blob);
        });
        
        // Generate the ZIP file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // Create download link
        const zipName = `compressed_images_${new Date().toISOString().slice(0, 10)}.zip`;
        const downloadUrl = URL.createObjectURL(zipBlob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = zipName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        URL.revokeObjectURL(downloadUrl);
        
        showNotification(`ZIP file "${zipName}" downloaded successfully!`, 'success');
        
    } catch (error) {
        console.error('Error creating ZIP:', error);
        showNotification('Error creating ZIP file. Downloading individually...', 'error');
        
        // Fallback to individual downloads
        processedImages.forEach((image, index) => {
            setTimeout(() => {
                const imageUrl = URL.createObjectURL(image.blob);
                downloadImage(image.name, imageUrl);
            }, index * 100);
        });
    }
}

// Reprocess images with current settings
function reprocessImages() {
    if (processedImages.length === 0) {
        showNotification('No images to reprocess.', 'error');
        return;
    }
    
    // Get original files from processed images
    const originalFiles = processedImages.map(img => img.originalFile);
    
    // Clear current results and restore original files
    selectedFiles = [...originalFiles];
    processedImages = [];
    
    // Show files section and hide results
    resultsSection.style.display = 'none';
    filesSection.style.display = 'block';
    
    // Refresh file list display
    filesList.innerHTML = '';
    selectedFiles.forEach(fileObj => {
        displayFile(fileObj);
    });
    
    showNotification('Images ready for reprocessing!', 'success');
}

// Start new batch
function startNewBatch() {
    clearAll();
    showNotification('Ready for new batch!', 'success');
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} fade-in`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = '#28a745';
            break;
        case 'error':
            notification.style.background = '#dc3545';
            break;
        case 'warning':
            notification.style.background = '#ffc107';
            notification.style.color = '#333';
            break;
        default:
            notification.style.background = '#17a2b8';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Utility function to create a download link for multiple files
function createZipDownload() {
    // This function is kept for backward compatibility
    downloadAll();
}
