%mem=8GB
%nprocshared=24
%chk=ammonia_inversion.chk
#p M06-2X/6-311++G(d,p) Opt=(TS,CalcFC,NoEigenTest) Freq

Ammonia inversion transition state calculation

0 1
N      0.000000     0.000000     0.000000
H      0.940000     0.000000    -0.389000
H     -0.470000     0.813689    -0.389000
H     -0.470000    -0.813689    -0.389000

