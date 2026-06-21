import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";

const SpinnerAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const Wrapper = styled.div`
  height: 60%;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  margin-top: 62px;
`;

const Spinner = styled.div`
  padding: 25px;
  border: 5px solid rgba(0, 0, 0, 0.1);
  border-top-color: #1e90ff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: ${SpinnerAnimation} 0.6s linear infinite;
  margin: 0 auto;
`;

const Text = styled.span`
  font-size: 0.85rem;
  padding: 16px;
`;

const LoadingSpinner = () => {
  const [randomPhrase, setRandomPhrase] = useState("");

  useEffect(() => {
    // Seleciona aleatoriamente uma das frases do array "frases"
    const frases = [
      "Assim como as flores precisam de tempo para desabrocharem em sua beleza completa, algumas situações na vida exigem uma espera paciente para revelarem seu melhor potencial.",
      "Assim como os livros levam tempo para serem escritos e polidos em grandes obras, algumas realizações na vida demandam uma espera paciente para serem alcançadas com sucesso.",
      "Assim como o céu precisa escurecer para que as estrelas brilhem mais intensamente, algumas dificuldades na vida requerem uma espera paciente para que possamos ver o brilho da solução.",
      "Assim como os quebra-cabeças levam tempo para serem montados em uma imagem completa, algumas conquistas na vida requerem uma espera paciente para que possamos ver a imagem perfeita se formando.",
      "Assim como a fermentação é necessária para transformar uvas em vinho, algumas mudanças na vida exigem uma espera paciente para que possamos ver a transformação completa e enriquecedora.",
      "Assim como o oceano leva tempo para moldar a costa em paisagens espetaculares, algumas jornadas na vida exigem uma espera paciente para que possamos ver a beleza espetacular da paisagem final.",
      "Assim como a música precisa de notas silenciosas para criar a harmonia perfeita, algumas experiências na vida requerem uma espera paciente para que possamos sentir a harmonia perfeita em nossas vidas.",
      "Assim como as sementes precisam de tempo para brotarem em plantas saudáveis e frutíferas, algumas metas na vida exigem uma espera paciente para que possamos colher os frutos mais suculentos.",
    ];
    const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
    setRandomPhrase(fraseAleatoria);
  }, []);

  return (
    <Wrapper>
      <Spinner />
      <Text>{randomPhrase}</Text>
    </Wrapper>
  );
};

export default LoadingSpinner;
