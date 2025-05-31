import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../providers/face_registration_provider.dart';
import '../../../../core/widgets/loading_overlay.dart';

class FaceRegistrationScreen extends StatefulWidget {
  final int studentId;

  const FaceRegistrationScreen({Key? key, required this.studentId}) : super(key: key);

  @override
  _FaceRegistrationScreenState createState() => _FaceRegistrationScreenState();
}

class _FaceRegistrationScreenState extends State<FaceRegistrationScreen> {
  File? _selectedImage;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    // Ambil data wajah yang sudah terdaftar saat halaman dibuka
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FaceRegistrationProvider>().getRegisteredFaces(widget.studentId);
    });
  }

  // Mengambil gambar dari kamera
  Future<void> _takePicture() async {
    final XFile? photo = await _picker.pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.front,
      maxHeight: 1080,
      maxWidth: 1080,
      imageQuality: 90,
    );

    if (photo != null) {
      setState(() {
        _selectedImage = File(photo.path);
      });
    }
  }

  // Daftar wajah
  Future<void> _registerFace() async {
    if (_selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silahkan ambil foto wajah terlebih dahulu')),
      );
      return;
    }

    final provider = context.read<FaceRegistrationProvider>();
    final success = await provider.registerFace(widget.studentId, _selectedImage!);

    if (success) {
      // Reset gambar yang dipilih setelah berhasil
      setState(() {
        _selectedImage = null;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.successMessage ?? 'Wajah berhasil didaftarkan')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.errorMessage ?? 'Gagal mendaftarkan wajah')),
      );
    }
  }

  // Hapus data wajah
  Future<void> _deleteFace(String embeddingId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Konfirmasi Hapus'),
        content: const Text('Apakah Anda yakin ingin menghapus data wajah ini?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Batal'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final provider = context.read<FaceRegistrationProvider>();
      final success = await provider.deleteFace(widget.studentId, embeddingId);

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(provider.successMessage ?? 'Data wajah berhasil dihapus')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(provider.errorMessage ?? 'Gagal menghapus data wajah')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pendaftaran Wajah'),
      ),
      body: Consumer<FaceRegistrationProvider>(
        builder: (context, provider, child) {
          final isLoading = provider.isLoading;

          return LoadingOverlay(
            isLoading: isLoading,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Informasi
                  const Card(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Pendaftaran Wajah untuk Absensi',
                            style: TextStyle(
                              fontSize: 18.0,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 8.0),
                          Text(
                            'Untuk hasil terbaik, pastikan:',
                            style: TextStyle(fontWeight: FontWeight.w500),
                          ),
                          SizedBox(height: 4.0),
                          Text('• Wajah terlihat jelas dengan pencahayaan baik'),
                          Text('• Tidak ada yang menutupi wajah (masker, kacamata hitam)'),
                          Text('• Posisikan wajah di tengah frame'),
                          Text('• Ekspresi wajah normal'),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24.0),

                  // Preview gambar
                  if (_selectedImage != null) ...[
                    SizedBox(
                      height: 300,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12.0),
                        child: Image.file(
                          _selectedImage!,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16.0),
                  ],

                  // Tombol ambil foto
                  ElevatedButton.icon(
                    onPressed: _takePicture,
                    icon: const Icon(Icons.camera_alt),
                    label: Text(_selectedImage == null ? 'Ambil Foto Wajah' : 'Ambil Ulang Foto'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.all(16.0),
                    ),
                  ),

                  const SizedBox(height: 16.0),

                  // Tombol daftar wajah
                  ElevatedButton(
                    onPressed: _selectedImage != null ? _registerFace : null,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.all(16.0),
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Daftarkan Wajah'),
                  ),

                  const SizedBox(height: 32.0),

                  // Daftar wajah terdaftar
                  const Text(
                    'Wajah yang Terdaftar',
                    style: TextStyle(
                      fontSize: 18.0,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  
                  const SizedBox(height: 8.0),

                  if (provider.registeredFaces.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24.0),
                      child: Center(
                        child: Text(
                          'Belum ada wajah yang terdaftar',
                          style: TextStyle(
                            fontSize: 16.0,
                            fontStyle: FontStyle.italic,
                            color: Colors.grey,
                          ),
                        ),
                      ),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: provider.registeredFaces.length,
                      itemBuilder: (context, index) {
                        final face = provider.registeredFaces[index];
                        final embeddingId = face['embedding_id'] as String;
                        final createdAt = face['created_at'] as String? ?? 'Unknown';
                        
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8.0),
                          child: ListTile(
                            leading: const CircleAvatar(
                              child: Icon(Icons.face),
                            ),
                            title: Text('Wajah #${index + 1}'),
                            subtitle: Text('Didaftarkan pada: ${_formatDate(createdAt)}'),
                            trailing: IconButton(
                              icon: const Icon(Icons.delete, color: Colors.red),
                              onPressed: () => _deleteFace(embeddingId),
                            ),
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // Format tanggal
  String _formatDate(String dateString) {
    try {
      final DateTime date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateString;
    }
  }
} 