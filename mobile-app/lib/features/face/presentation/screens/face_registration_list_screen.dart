import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:toastification/toastification.dart';
import '../../../../core/constants/colors.dart';
import '../providers/face_provider.dart';
import '../../data/models/face_model.dart';
import 'face_registration_screen.dart';

class FaceRegistrationListScreen extends StatefulWidget {
  final int studentId;

  const FaceRegistrationListScreen({
    Key? key,
    required this.studentId,
  }) : super(key: key);

  @override
  State<FaceRegistrationListScreen> createState() => _FaceRegistrationListScreenState();
}

class _FaceRegistrationListScreenState extends State<FaceRegistrationListScreen> {
  @override
  void initState() {
    super.initState();
    // Load registered faces when screen initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadRegisteredFaces();
    });
  }

  Future<void> _loadRegisteredFaces() async {
    final faceProvider = Provider.of<FaceProvider>(context, listen: false);
    await faceProvider.loadRegisteredFaces(widget.studentId);
  }

  Future<void> _deleteFace(FaceModel face) async {
    final faceProvider = Provider.of<FaceProvider>(context, listen: false);
    
    // Show confirmation dialog
    final bool? shouldDelete = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Konfirmasi'),
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
        );
      },
    );
    
    if (shouldDelete != true) return;
    
    // Delete face
    final bool success = await faceProvider.deleteFace(widget.studentId, face.embeddingId);
    
    if (!mounted) return;
    
    if (success) {
      toastification.show(
        context: context,
        type: ToastificationType.success,
        style: ToastificationStyle.fillColored,
        title: const Text('Berhasil'),
        description: const Text('Data wajah berhasil dihapus'),
        autoCloseDuration: const Duration(seconds: 3),
        showProgressBar: true,
      );
    } else {
      toastification.show(
        context: context,
        type: ToastificationType.error,
        style: ToastificationStyle.fillColored,
        title: const Text('Gagal'),
        description: Text(faceProvider.errorMessage),
        autoCloseDuration: const Duration(seconds: 3),
        showProgressBar: true,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Data Wajah Terdaftar'),
        elevation: 0,
      ),
      body: Consumer<FaceProvider>(
        builder: (context, faceProvider, _) {
          if (faceProvider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }
          
          if (faceProvider.errorMessage.isNotEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Error: ${faceProvider.errorMessage}',
                    style: const TextStyle(color: Colors.red),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadRegisteredFaces,
                    child: const Text('Coba Lagi'),
                  ),
                ],
              ),
            );
          }
          
          if (faceProvider.registeredFaces.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.face,
                    size: 80,
                    color: Colors.grey,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Belum ada data wajah terdaftar',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Silakan mendaftarkan wajah Anda untuk fitur absensi',
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => FaceRegistrationScreen(
                            studentId: widget.studentId,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.add_a_photo),
                    label: const Text('Tambah Wajah'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                  ),
                ],
              ),
            );
          }
          
          return RefreshIndicator(
            onRefresh: _loadRegisteredFaces,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Wajah Terdaftar',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '${faceProvider.registeredFaces.length}/3',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: faceProvider.registeredFaces.length >= 3 
                              ? Colors.red 
                              : Colors.grey[700],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Anda dapat mendaftarkan maksimal 3 wajah',
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: ListView.builder(
                      itemCount: faceProvider.registeredFaces.length,
                      itemBuilder: (context, index) {
                        final face = faceProvider.registeredFaces[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 16),
                          elevation: 2,
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            leading: CircleAvatar(
                              backgroundColor: AppColors.primary,
                              child: const Icon(
                                Icons.face,
                                color: Colors.white,
                              ),
                            ),
                            title: Text(
                              'Data Wajah #${index + 1}',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            subtitle: Text(
                              'Terdaftar: ${face.createdAt?.split('T')[0] ?? 'N/A'}',
                              style: const TextStyle(fontSize: 12),
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.delete, color: Colors.red),
                              onPressed: () => _deleteFace(face),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
      floatingActionButton: Consumer<FaceProvider>(
        builder: (context, faceProvider, _) {
          if (faceProvider.registeredFaces.length >= 3 || faceProvider.isLoading) {
            return const SizedBox();
          }
          
          return FloatingActionButton(
            child: const Icon(Icons.add_a_photo),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => FaceRegistrationScreen(
                    studentId: widget.studentId,
                  ),
                ),
              ).then((_) => _loadRegisteredFaces());
            },
          );
        },
      ),
    );
  }
} 