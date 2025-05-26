import 'package:flutter/material.dart';
import 'package:toastification/toastification.dart';
import '../constants/colors.dart';

class ToastUtils {
  // Success toast
  static void showSuccessToast(BuildContext context, String message) {
    toastification.show(
      context: context,
      type: ToastificationType.success,
      style: ToastificationStyle.flatColored,
      autoCloseDuration: const Duration(seconds: 3),
      title: Text('Berhasil'),
      description: Text(message),
      showProgressBar: true,
      primaryColor: AppColors.success,
      closeOnClick: true,
      dragToClose: true,
    );
  }

  // Error toast
  static void showErrorToast(BuildContext context, String message) {
    toastification.show(
      context: context,
      type: ToastificationType.error,
      style: ToastificationStyle.flatColored,
      autoCloseDuration: const Duration(seconds: 3),
      title: Text('Error'),
      description: Text(message),
      showProgressBar: true,
      primaryColor: AppColors.error,
      closeOnClick: true,
      dragToClose: true,
    );
  }

  // Warning toast
  static void showWarningToast(BuildContext context, String message) {
    toastification.show(
      context: context,
      type: ToastificationType.warning,
      style: ToastificationStyle.flatColored,
      autoCloseDuration: const Duration(seconds: 3),
      title: Text('Perhatian'),
      description: Text(message),
      showProgressBar: true,
      primaryColor: AppColors.warning,
      closeOnClick: true,
      dragToClose: true,
    );
  }

  // Info toast
  static void showInfoToast(BuildContext context, String message) {
    toastification.show(
      context: context,
      type: ToastificationType.info,
      style: ToastificationStyle.flatColored,
      autoCloseDuration: const Duration(seconds: 3),
      title: Text('Informasi'),
      description: Text(message),
      showProgressBar: true,
      primaryColor: AppColors.info,
      closeOnClick: true,
      dragToClose: true,
    );
  }
}
