// lib/models/exercise_data.dart
// โมเดลข้อมูลการออกกำลังกายแต่ละท่า

class ExerciseData {
  int rounds;
  int leftReps;
  int rightReps;

  ExerciseData({
    this.rounds = 0,
    this.leftReps = 0,
    this.rightReps = 0,
  });

  Map<String, dynamic> toJson() {
    return {
      'rounds': rounds,
      'leftReps': leftReps,
      'rightReps': rightReps,
    };
  }

  factory ExerciseData.fromJson(Map<String, dynamic> json) {
    return ExerciseData(
      rounds: json['rounds'] ?? 0,
      leftReps: json['leftReps'] ?? 0,
      rightReps: json['rightReps'] ?? 0,
    );
  }

  ExerciseData copyWith({
    int? rounds,
    int? leftReps,
    int? rightReps,
  }) {
    return ExerciseData(
      rounds: rounds ?? this.rounds,
      leftReps: leftReps ?? this.leftReps,
      rightReps: rightReps ?? this.rightReps,
    );
  }

  @override
  String toString() {
    return 'ExerciseData(rounds: $rounds, leftReps: $leftReps, rightReps: $rightReps)';
  }
}