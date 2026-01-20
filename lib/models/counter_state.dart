// lib/models/counter_state.dart
// โมเดลสถานะของตัวนับการออกกำลังกาย

class CounterState {
  int leftCounter;
  int rightCounter;
  int roundCounter;
  int targetReps;
  int currentExercise;

  CounterState({
    this.leftCounter = 0,
    this.rightCounter = 0,
    this.roundCounter = 0,
    this.targetReps = 10,
    this.currentExercise = 1,
  });

  CounterState copyWith({
    int? leftCounter,
    int? rightCounter,
    int? roundCounter,
    int? targetReps,
    int? currentExercise,
  }) {
    return CounterState(
      leftCounter: leftCounter ?? this.leftCounter,
      rightCounter: rightCounter ?? this.rightCounter,
      roundCounter: roundCounter ?? this.roundCounter,
      targetReps: targetReps ?? this.targetReps,
      currentExercise: currentExercise ?? this.currentExercise,
    );
  }

  void reset() {
    leftCounter = 0;
    rightCounter = 0;
    roundCounter = 0;
  }

  Map<String, dynamic> toJson() {
    return {
      'leftCounter': leftCounter,
      'rightCounter': rightCounter,
      'roundCounter': roundCounter,
      'targetReps': targetReps,
      'currentExercise': currentExercise,
    };
  }

  factory CounterState.fromJson(Map<String, dynamic> json) {
    return CounterState(
      leftCounter: json['leftCounter'] ?? 0,
      rightCounter: json['rightCounter'] ?? 0,
      roundCounter: json['roundCounter'] ?? 0,
      targetReps: json['targetReps'] ?? 10,
      currentExercise: json['currentExercise'] ?? 1,
    );
  }

  @override
  String toString() {
    return 'CounterState(left: $leftCounter, right: $rightCounter, round: $roundCounter, target: $targetReps, exercise: $currentExercise)';
  }
}